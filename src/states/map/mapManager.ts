import ndarray from 'ndarray';
import * as MapGenerator from 'worker-loader!workers/worldMapGenerator';
import * as HeightGen from 'worker-loader!workers/heightGen';
import * as RiverGen from 'worker-loader!workers/riverGen';
import localForage from 'localforage';
import isnd from 'isndarray';
import ndarrayJSON from 'ndarray-json';
import _ from 'lodash';


async function runWorker(worker: any, data: any) {
  const context = new worker();
  return new Promise((resolve, reject) => {
    context.postMessage(data);
    context.addEventListener('message', result => {
      resolve(result.data);
    });
  });
}


export interface MapSegmentData {
  heightmap?: ndarray,
  radiation?: ndarray,
  rainfall?: ndarray,
  biome?: ndarray,
  level?: any,
  stats?: any,
};

const ndarrayKeys = [
  'heightmap',
  'radiation',
  'rainfall',
  'biome',
]

export interface GameMapStore {
  [coord: string]: MapSegmentData | null
};

export interface MapSettings {
  sealevel: number,
  size: number,
  seed: number,
  regionScale: number,
}
export enum MapLevels {
  world,
  region,
  sector
}

export interface GameMap {
  settings: MapSettings,
  mapName?: string,
  store: {
    world?: MapSegmentData,
    regions?: {
      [coord: string]: MapSegmentData
    }
  },
}

export const blankGameMap: GameMap = {
  settings: {
    sealevel: 150,
    size: 300,
    seed: Math.random(),
    regionScale: 30,
  },
  store: {
    world: {},
    regions: {},
  },
};

interface IMapManagerOptions {
}

const MAP_SAVES_PREFIX = 'denariusMaps-';

function serialize(value: any): any {
  if (_.isObject(value)) {
    if (isnd(value)) {
      return {
        __type: 'ndarray',
        data: ndarrayJSON.stringify(value)
      };
    }
    return _.mapValues(value, serialize);
  }
  return value;
}

function deserialize(value: any) {
  if (_.isObject(value)) {
    if (value.__type) {
      return ndarrayJSON.parse(value.data);
    }
    return _.mapValues(value, deserialize);
  }
  return value;
}


// Generates, saves and loads game world maps
export default class MapManager {
  gameMap: GameMap;

  constructor() {
    this.gameMap = Object.assign({}, blankGameMap);
  }

  async load(name: string) {
    const rawData = <string>await localForage.getItem(
      MAP_SAVES_PREFIX + name,
    );
    const jsonData = JSON.parse(rawData);
    this.gameMap = deserialize(jsonData);
    console.log('loaded game map', this.gameMap);
  }

  async save(name?: string) {
    const numSaves = (await this.listSaves()).length;
    if (!name) {
      name = `Map #${numSaves + 1}`;
    }
    this.gameMap.mapName = name;
    localForage.setItem(
      MAP_SAVES_PREFIX + name,
      JSON.stringify(serialize(this.gameMap)),
    );
  }

  async deleteSave(name: string): Promise<void> {
    const saves = await this.listSaves();
    if (name in saves) {
      return await localForage.removeItem(MAP_SAVES_PREFIX + name);
    }
    throw new Error(`Save '${name}' does not exist`);
  }

  async listSaves(): Promise<string[]> {
    const keys = await localForage.keys();
    return keys
      .filter(key => key.startsWith(MAP_SAVES_PREFIX))
      .map(key => key.replace(MAP_SAVES_PREFIX, ''));
  }

  // resets current map, uses the same settings
  reset() {
    delete this.gameMap.mapName;
    this.gameMap.store = Object.assign({}, blankGameMap.store);
  }

  async makeWorldHeightmap(): Promise<ndarray> {
    // step 1
    const { size } = this.gameMap.settings;
    const data: any = await runWorker(HeightGen, {
      ...this.gameMap.settings,
      level: 'world',
      position: { x: 0, y: 0 }
    });
    return ndarray(data, [size, size]);
  }

  async makeRegionHeightmap(x: number, y: number): Promise<ndarray> {
    const { size } = this.gameMap.settings;
    const data: any = await runWorker(HeightGen, {
      ...this.gameMap.settings,
      level: 'region',
      position: { x, y },
    });
    return ndarray(data, [size, size]);
  }

  isValidRegion(x: number, y: number): boolean {
    const size = this.gameMap.settings.regionScale;
    return x >= 0 && y >= 0 && x < size && y < size;
  }
  
  getRegionKey(x: number, y: number) {
    return `${x}-${y}`;
  }

  async init(): Promise<[MapSegmentData, Phaser.Point]> {
    this.reset();
    const startRegion = await this.stepZero();
    return [await this.generateRegion(startRegion), startRegion];
  }

  // generate one region to completion
  async generateRegion(region: Phaser.Point): Promise<MapSegmentData> {
    return await this.stepOne(region);
  }

  // make a world map and return a suitable start region
  // returns a suitable start region
  async stepZero(): Promise<Phaser.Point>  {
    const { size, regionScale, sealevel } = this.gameMap.settings;
    // generate world map
    const heightmap = await this.makeWorldHeightmap();
    this.gameMap.store.world.heightmap = heightmap;

    // determine starting region to generate
    // this region is the first active region
    let possibleRegions = [];
    const regionSize = size / regionScale;
    for (let x = 0; x < regionScale; x++) {
      for (let y = 0; y < regionScale; y++) {
        let waterSum = 0;
        let landSum = 0;
        const maxX = (x * regionSize) + regionSize;
        const maxY = (y * regionSize) + regionSize;
        // loop over each cell in the region
        for (let i = x * regionSize; i < maxX; i++) {
          for (let j = y * regionSize; j < maxY; j++) {
            const height = heightmap.get(
              Math.round(i),
              Math.round(j),
            );
            if (height < sealevel) {
              waterSum += 1;
            } else {
              landSum += 1;
            }
          }
        }
        const percentLand = landSum / (regionSize * regionSize);
        // between 50% and 80% land
        if (percentLand >= 0.5 && percentLand < 0.8) {
          possibleRegions.push([x, y]);
        }
      }
    }
    const r = possibleRegions[_.random(0, possibleRegions.length - 1)];
    return new Phaser.Point(r[0], r[1]);
  }

  // ensure this region and all neighboring regions have heightmaps
  async stepOne({ x, y }: { x: number, y: number}) {
    console.time('Step 1');
    // generate heightmap for this region if one doesn't exist
    const key = this.getRegionKey(x, y);
    if (this.gameMap.store.regions[key] && this.gameMap.store.regions[key].heightmap) {
      return; // already exists
    }
    this.gameMap.store.regions[key] = {
      heightmap: await this.makeRegionHeightmap(x, y),
    };

    // generate heightmaps for all 8-neighboring cells if they don't exist
    const neighbors = [
      [x - 1, y],
      [x, y - 1],
      [x - 1, y - 1],
      [x - 1, y + 1],

      [x + 1, y],
      [x, y + 1],
      [x + 1, y - 1],
      [x + 1, y + 1],
    ];

    // generate heightmaps for all 8-neighboring cells if they don't exist
    // each will be generated in parallel workers
    const result = await Promise.all(
      neighbors
        .map(item => {
          const isValid = this.isValidRegion(item[0], item[1]);
          const itemKey = this.getRegionKey(item[0], item[1]);
          const hasHeightmap = (
            this.gameMap.store.regions[itemKey] &&
            this.gameMap.store.regions[itemKey].heightmap
          );
          
          // return heightmap worker promise
          if (isValid && !hasHeightmap) {
            return this.makeRegionHeightmap(item[0], item[1]);
          }
          // heightmap already exists
          return Promise.resolve(null);
        })
    );

    for (let i = 0; i < neighbors.length; i++) {
      const item = neighbors[i];
      const itemKey = this.getRegionKey(item[0], item[1]);
      if (result[i]) {
        this.gameMap.store.regions[itemKey] = {
          heightmap: result[i],
        };
      }
    }
    console.timeEnd('Step 1');
    console.log('step 1 result', this.gameMap.store.regions[key]);
    return this.gameMap.store.regions[key];
  }
}
