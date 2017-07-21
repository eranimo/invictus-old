import ndarray from 'ndarray';
import * as MapGenerator from 'worker-loader!workers/worldMapGenerator';


export interface MapSegmentData {
  heightmap: ndarray,
  radiation: ndarray,
  rainfall: ndarray,
  biome: ndarray,
  level: any,
  stats: any,
};

export interface GameMapStore {
  [coord: string]: MapSegmentData | null
};

export interface MapSettings {
  sealevel: number,
  size: number,
  seed: number,
}
export enum MapLevels {
  world,
  region,
  sector
}

export interface GameMap {
  settings: MapSettings,
  store: {
    world: MapSegmentData | null,
    region: GameMapStore | null,
    sector: GameMapStore | null,
  }
}

export const blankGameMap: GameMap = {
  settings: {
    sealevel: 150,
    size: 500,
    seed: Math.random(),
  },
  store: {
    world: null,
    region: null,
    sector: null,
  },
};

interface IMapManagerOptions {
  // called when a map segment was generated
  onGenerate: (segment: MapSegmentData) => void
}

// Generates, saves and loads game world maps
export default class MapManager {
  gameMap: GameMap;
  onGenerate: (segment: MapSegmentData) => void;

  constructor(options: IMapManagerOptions) {
    this.onGenerate = options.onGenerate;
    this.gameMap = blankGameMap;

    this.gameMap.store = {
      world: null,
      region: null,
      sector: null,
    };

    let self = this;
  }

  // generates a map segment
  async generateMapSegment(
    level: string,
    position: { x: number, y: number }
  ): Promise<MapSegmentData> {
    const { size, sealevel } = this.gameMap.settings;
    return new Promise<MapSegmentData>((resolve: any) => {
      const mapGenerator = new MapGenerator();
      mapGenerator.postMessage({
        heightmap: {
          ...this.gameMap.settings,
          level,
          position,
        },
      });
      console.log('Map gen', level, position);
      mapGenerator.addEventListener('message', event => {
        const data: MapSegmentData = Object.create(null);
        data.level = level;
        data.stats = event.data.stats;
        data.heightmap = ndarray(event.data.heightmap, [size, size]);
        data.radiation = ndarray(event.data.radiation, [size, size]);
        data.rainfall = ndarray(event.data.rainfall, [size, size]);
        data.biome = ndarray(event.data.biome, [size, size]);
        Object.freeze(data);
        resolve(data);
      });
    });
  }

  // resets current map, uses the same settings
  reset() {
    this.gameMap.store = {
      world: null,
      region: null,
      sector: null,
    };
  }
  
  // Generates a map segment
  fetchMapSegment(
    level: MapLevels,
    region?: { x: number, y: number },
    sector?: { x: number, y: number }
  ){
    const size = this.gameMap.settings.size;
    switch (level) {
      case MapLevels.world:
        // regen world
        if (this.gameMap.store.world) {
          console.log('getting world map from cache');
          this.onGenerate(this.gameMap.store.world);
        } else {
          this.gameMap.store.world = null;
          this.generateMapSegment('world', { x: 0, y: 0 })
            .then(((data: MapSegmentData) => {
              console.log('generate world map', data);
              this.gameMap.store.world = data;
              this.onGenerate(data);
            }));
        }
      break;
      case MapLevels.region: {
        // regen world and region
        const index = region.x + '.' + region.y;
        if (this.gameMap.store.region && this.gameMap.store.region[index]) {
          console.log('getting region map from cache');
          this.onGenerate(this.gameMap.store.region[index]);
        } else {
          if (!this.gameMap.store.region) {
            this.gameMap.store.region = {};
          }
          this.generateMapSegment('region', {
            x: region.x * size,
            y: region.y * size,
          })
            .then(((data: MapSegmentData) => {
              console.log('generate region map')
              this.gameMap.store.region[index] = data;
              this.onGenerate(data);
            }));
        }
      }
      break;
      case MapLevels.sector: {
        // regen world, sector, and sector
        const index = region.x + '.' + region.y + '-' + sector.x + '.' + sector.y;
        if (this.gameMap.store.sector && this.gameMap.store.sector[index]) {
          console.log('getting sector map from cache');
          this.onGenerate(this.gameMap.store.sector[index]);
        } else {
          if (!this.gameMap.store.sector) {
            this.gameMap.store.sector = {};
          }
          this.generateMapSegment('sector', {
            x: (region.x * size * 10) + (sector.x * size),
            y: (region.y * size * 10) + (sector.y * size),
          })
            .then(((data: MapSegmentData) => {
              console.log('generate sector map')
              this.gameMap.store.sector[index] = data;
              this.onGenerate(data);
            }));
        }
      }
      break;
    }
  }
}
