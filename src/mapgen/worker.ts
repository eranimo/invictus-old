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
    child.parent = this;
    this.children.push(child);
  }

  // maximum depth of tree
  get height(): number {
    if (this.children.length === 0) {
      return 0;
    }
    if (this.children.length === 1) {
      return this.children[0].height + 1;
    }
    const heightLeft = this.children[0].height;
    const heightRight = this.children[1].height;
    return Math.max(heightLeft, heightRight) + 1;
  }
}

class LazyNoiseMap {
  ndarray: ndarray;
  size: number;
  private createFn: (...dim: number[]) => number;

  constructor(arrayType: any, size: number, createFn: (...dim: number[]) => number) {
    this.ndarray = ndarray(new arrayType(size * size), [size, size]);
    this.size = size;
    this.createFn = createFn;
  }

  get(x: number, y: number) {
    if (x < 0 && y < 0 && x >= this.size && y >= this.size) {
      return undefined;
    }
    let value = this.ndarray.get(x, y);
    if (value === 0) {
      value = this.createFn(x, y);
      this.ndarray.set(x, y, value);
    }
    return value;
  }

  set(x: number, y: number, value: number) {
    this.ndarray.set(x, y, value);
  }

  get data() {
    return this.ndarray.data;
  }
}

const get4Neighbor = (x: number, y: number) => ([
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
]);

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
  const noiseFn = zoomableNoise(simplex.noise2D.bind(simplex));
  worldHeightMap = ndarray(new Uint8ClampedArray(size * size), [size, size]);
  fill(worldHeightMap, (x, y) => {
    return noiseFn(levels.world)(x / size + 0.5, y / size + 0.5) * 255;
  });

  // generate regional height for selected costal cells
  // only generate the height when it's needed
  regionalHeightMap = new LazyNoiseMap(Uint8ClampedArray, regionSize, ((x, y) => {
    const nx = x / zoomLevel;
    const ny = y / zoomLevel;
    return noiseFn(levels.region)(nx / size + 0.5, ny / size + 0.5) * 255;
  }));

  // determine costal cells
  let costalCells: Array<number[]> = [];
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const height = worldHeightMap.get(x, y);
      // this cell is above sea level in the world map
      if (height > sealevel) {
        // get this cell's neighbors
        const validNeighbors = _(get4Neighbor(x, y))
          .map(([nx, ny]) => worldHeightMap.get(nx, ny))
          .filter(nh => !!nh)
          .value();
        
        if (validNeighbors.length > 0) {
          // are any neighbors below sealevel
          const isCostal = validNeighbors.some(nh => nh < sealevel);

          if (isCostal) {
            // at least one 4-neighbor is ocean, so we're costal
            costalCells.push([x, y, height]);
          }
        }
      }
    }
  }
  console.log(`There are ${costalCells.length} costal cells`);
  console.log('costalCells', costalCells);
  console.log('worldHeightMap', worldHeightMap);

  // fill regional river map
  regionalRiverMap = ndarray(new Uint8ClampedArray(regionSize * regionSize), [regionSize, regionSize]);
  fill(regionalRiverMap, (x, y) => 0);

  const regionalCostalCells = costalCells.map((item) => {
    const scaledX = Math.round(item[0] * zoomLevel); // Math.round(zoomLevel / 2);
    const scaledY = Math.round(item[1] * zoomLevel); // Math.round(zoomLevel / 2);
    item[2] = regionalHeightMap.get(scaledX, scaledY);
    if (item[2] > sealevel) {
      item[0] = scaledX;
      item[1] = scaledY;
      // regionalRiverMap.set(scaledX, scaledY, 1);
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
  let riverSourceNodes = riverSources.map(([x, y, height]) => {
    return new TreeNode({ x, y, height });
  });

  
  // run river algorithm on source cells
  function riverStep(node: TreeNode) {
    const { x, y, height } = node.data;

    regionalRiverMap.set(x, y, 1);
    
    // 5% chance of branching
    const numBranches = rng() < 0.05 ? 2 : 1; 

    _(get4Neighbor(x, y))
      // remove cells that are already rivers
      .filter(([nx, ny]) => regionalRiverMap.get(nx, ny) === 0)
      // get height of neighbors
      .map(([nx, ny]) => [nx, ny, regionalHeightMap.get(nx, ny)])
      // remove neighbors off edge of map
      // remove heighbors lower than current node
      .filter(item => item[2] && item[2] >= height && item[2] > sealevel)
      // sort cells by increasing height
      .orderBy(item => item[2], ['ASC'])
      // decide how many branches to take
      .slice(0, numBranches)
      // create children nodes
      .forEach((item) => {
        const nextNode = new TreeNode({ x: item[0], y: item[1], height: item[2] });
        node.addChild(nextNode);
        // continue river algorithm at this next cell
        riverStep(nextNode);
      })
  }
  riverSourceNodes.forEach(node => {
    riverStep(node);
  });
  // riverSourceNodes = riverSourceNodes.filter(node => node.children.length > 0);
  console.log(riverSourceNodes);

  worldRiverMap = ndarray(new Uint8ClampedArray(size * size), [size, size]);
  fill(worldRiverMap, (x, y) => 0);
  for (let x = 0; x < regionSize; x++) {
    for (let y = 0; y < regionSize; y++) {
      const hasRiver = regionalRiverMap.get(x, y);
      if (hasRiver) {
        worldRiverMap.set(
          Math.floor(x / zoomLevel),
          Math.floor(y / zoomLevel),
          1
        );
      }
    }
  }

  console.groupEnd();
  return {
    worldHeightMap: worldHeightMap.data.slice(),
    worldRiverMap: worldRiverMap.data.slice(),
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