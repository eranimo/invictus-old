import ndarray from 'ndarray';
import ops from 'ndarray-ops';
import SimplexNoise from 'simplex-noise';
import fill from 'ndarray-fill';
import Alea from 'alea';
import { shuffle, memoize, default as _ } from 'lodash';
import { levels } from 'mapgen/levels';
import zoomableNoise from '../utils/zoomableNoise';
import { BIOMES } from '../mapgen/biomes';
import { registerPromiseWorker } from 'utils/workerUtils';
import * as ACTIONS from './workerActions';


function makeWorldHeightmap(size, noiseFn) {
  const heightmap = ndarray(new Uint8ClampedArray(size * size), [size, size]);

  const levelOptions = {
    numIterations: 5,
    persistence: 0.6,
    initFrequency: 2,
  };

  fill(heightmap, (x, y) => {
    const nx = x;
    const ny = y;
    return zoomableNoise(noiseFn)(levelOptions)(nx / size + 0.5, ny / size + 0.5) * 255;
  });
  return heightmap;
}

// world heightmap used to determine where to place rivers
let worldHeightMap: ndarray;
// larger zoomed in version of the world heightmap
let regionalHeightMap: LazyNoiseMap;
// marks where river are in the regional map
let regionalRiverMap: ndarray;
// scaled down version of the regional river map for world map display
let worldRiverMap: ndarray;
let regionalBiomeMap

// stats
let heightMin: number;
let heightMax: number;

function randomInt(rng: Function, number: number) {
  return Math.round(rng() * number);
}


class TreeNode<T = any> {
  parent?: TreeNode<T>;
  children?: TreeNode<T>[];
  data?: T;

  // A DS representing a node on a tree
  constructor(data?: T) {
    this.parent = null;
    this.children = [];
    this.data = data;
  }

  /** Add a new child node, mark this as its parent */
  addChild(child: TreeNode<T>): void {
    this.parent = child;
    this.children.push(child);
  }

  /** Gets the number of nodes to the root node */
  get depth(): number {
    let current: TreeNode<T> = this;
    let count = 0;
    while (current !== null) {
      if (this.parent) {
        count++;
        current = this.parent;
      } else {
        current = null;
      }
    }
    return count;
  }
}

class LazyNoiseMap {
  ndarray: ndarray;
  size: number;
  createFn: (...dim: number[]) => number;

  constructor(arrayType: any, size: number, createFn: (...dim: number[]) => number) {
    this.ndarray = ndarray(new arrayType(size * size, [size, size]));
    this.size = size;
    this.createFn = createFn;
  }

  get(x: number, y: number) {
    if (x < 0 && y < 0 && x >= this.size && y >= this.size) {
      return undefined;
    }
    let value = this.ndarray.get(x, y);
    if (!value) {
      value = this.createFn(x, y);
      this.ndarray.set(x, y, value);
      return value;
    }
    return value;
  }

  set(x: number, y: number, value: number) {
    this.ndarray.set(x, y, value);
  }
}

const get4Neighbor = memoize((x: number, y: number) => ([
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
]));

async function init(settings) {
  console.group('map gen worker init');
  console.log('Settings:', settings);
  // generate world heightmap
  const { size, seed, sealevel } = settings;
  const { zoomLevel } = levels.region;
  const regionSize = zoomLevel * size;
  console.log(`Generating world of size ${regionSize}x${regionSize} (${size}x${size})`);
  const rng = new Alea(seed);
  const simplex = new SimplexNoise(rng);
  const noiseFn = (nx, ny) => simplex.noise2D(nx, ny);
  worldHeightMap = makeWorldHeightmap(size, noiseFn);
  heightMin = ops.inf(worldHeightMap);
  heightMax = ops.sup(worldHeightMap);

  // generate regional height for selected costal cells
  // only generate the height when it's needed
  regionalHeightMap = new LazyNoiseMap(Uint8ClampedArray, size, ((x, y) => {
    return zoomableNoise(noiseFn)(levels.region)(x / size + 0.5, y / size + 0.5) * 255;
  }));

  // determine costal cells
  let costalCells: Array<number[]> = [];
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const height = worldHeightMap.get(x, y);
      const hasOceanNeighbor = _(get4Neighbor(x, y))
        .map(([x, y]) => worldHeightMap.get(x, y))
        .some(height => height && height < sealevel);

      if (
        height > sealevel &&
        hasOceanNeighbor
      ) {
        // at least one 4-neighbor is ocean, so we're costal
        costalCells.push([x, y, height]);
      }
    }
  }
  console.log(`There are ${costalCells.length} costal cells`);
  console.log('costalCells', costalCells);

  const regionalCostalCells = costalCells.map((item) => {
    item[2] = regionalHeightMap.get(item[0], item[1]);
    if (item[2] > sealevel) {
      return item;
    }
    return null;
  }).filter(i => i);
  console.log('regionalCostalCells', regionalCostalCells);

  // pick river source cells
  const numRivers = Math.round(size * 0.1) + randomInt(rng, Math.round(size * 0.1));
  console.log(`Generating ${numRivers} rivers`);
  const riverSources = shuffle(regionalCostalCells)
    .slice(0, numRivers);
  
  // make river source nodes
  const riverSourceNodes = riverSources.map(([x, y, height]) => {
    return new TreeNode({ x, y, height });
  });

  // fill regional river map
  regionalRiverMap = ndarray(new Uint8ClampedArray(size * size), [size, size]);
  fill(regionalRiverMap, (x, y) => 0);

  
  // run river algorithm on source cells
  function riverStep(node: TreeNode) {
    const { x, y, height } = node.data;

    regionalRiverMap.set(x, y, 1);
    
    // 5% chance of branching
    const numBranches = rng() < 0.05 ? 2 : 1; 

    _(get4Neighbor(x, y))
      // get height of neighbors
      .map(([nx, ny]) => [nx, ny, regionalHeightMap.get(nx, ny)])
      // remove neighbors off edge of map and heighbors lower than current node
      .filter(item => item[2] && item[2] > height)
      // remove cells that are already rivers
      .filter(item => regionalRiverMap.get(x, y) === 0)
      // sort cells by increasing height
      .orderBy(item => item[2], ['ASC'])
      // decide how many branches to take
      .slice(0, numBranches)
      // create children nodes
      .forEach((item) => {
        console.log('making child');
        const nextNode = new TreeNode(item);
        node.addChild(nextNode);
        // continue river algorithm at this next cell
        riverStep(node);
      })
  }
  riverSourceNodes.forEach(riverStep);
  console.log(riverSourceNodes);

  console.groupEnd();
  return {
    worldHeightMap: worldHeightMap.data.slice(),
    regionalRiverMap: regionalRiverMap.data.slice(),
  };
}

function generateChunk(chunk) {

}

registerPromiseWorker(async message => {
  switch (message.type) {
    case ACTIONS.WORLD_INIT: {
      return await init(message.payload);
    };
    case ACTIONS.GENERATE_CHUNK: {
      return await generateChunk(message.payload);
    }
  }
});