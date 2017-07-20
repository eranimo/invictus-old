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

const blankGameMap: GameMap = {
  settings: {
    sealevel: 150,
    size: 250,
    seed: Math.random(),
  },
  store: {
    world: null,
    region: null,
    sector: null,
  },
};

interface IMapManagerOptions {
  onGenerate: (segment: MapSegmentData) => void
}

/**
 * Generates, saves and loads game world maps
 * 
 * Methods
 * 
 * generate()
 * 
 * 
 **/
export default class MapManager {
  gameMap: GameMap;
  onGenerate: (segment: MapSegmentData) => void;

  constructor(options: IMapManagerOptions) {
    this.onGenerate = options.onGenerate;
    this.gameMap = blankGameMap;

    let self = this;
  }

  async generateMap(
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

  create(mapSettings: MapSettings) {
    this.gameMap.settings = mapSettings;
  }

  reset() {
    this.gameMap.store = {
      world: null,
      region: null,
      sector: null,
    };
  }
  
  /**
   * Regenerates the current level and all above it
   */
  fetchMap(
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
          this.generateMap('world', { x: 0, y: 0 })
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
          this.generateMap('region', {
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
          this.generateMap('sector', {
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
