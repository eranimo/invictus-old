import { Game, State, Sprite, Point} from 'phaser-ce';
//import { time } from 'core-decorators';
import * as MapGenerator from 'worker-loader!../workers/worldMapGenerator';
import ndarray from 'ndarray';
import { VIEWS, View } from './map/views';
import renderUI, {
  store,
  setView,
  setMapSeed,
  toggleGrid,
  UIState,
  selectRegion,
  selectSector,
  moveCursor,
} from './map/ui';


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

export interface GameMap {
  settings: {
    size: number,
    seed: number,
  },
  store: {
    world: MapSegmentData | null,
    region: GameMapStore | null,
    sector: GameMapStore | null,
  }
}

const blankGameMap: GameMap = {
  settings: {
    size: 250,
    seed: Math.random(),
  },
  store: {
    world: null,
    region: null,
    sector: null,
  },
};

const SEALEVEL = 150;

export default class Map extends State {
  views: Array<View>;
  regionScale: number;
  regionSize: number;
  
  mapBitmapData: Phaser.BitmapData; // map image bitmap

  mapSprite: Sprite;
  mapCursorSprite: Sprite;
  mapGrid: Sprite;

  cellWidth: number;
  cellHeight: number;

  cursors: any;

  gameMap: GameMap;
  mapState: UIState;
  currentSegment: MapSegmentData;

  init() {
    this.stage.backgroundColor = '#2d2d2d';
    this.regionScale = 10;

    this.world.scale.set(1000 / 900);

    this.gameMap = blankGameMap;
    this.mapState = store.getState();
    store.subscribe(() => {
      this.mapState = store.getState();
      this.renderMap();
      this.updateCursor();
    });

    renderUI({
      save: () => console.log('save map'),
      regen: () => {
        console.log('regen map');
        this.regen();
      }
    });

    this.regionSize = this.mapState.size / this.regionScale;
  }

  // get currentSegment(): MapSegmentData | null {
  //   if (!this.mapState.currentRegion) {
  //     // world
  //     return this.gameMap.store.world;
  //   } else if (this.mapState.currentRegion && !this.mapState.currentSector) {
  //     // region
  //     if (!this.gameMap.store.region) {
  //       this.gameMap.store.region = {};
  //     }
  //     return this.gameMap.store.region[
  //       this.mapState.currentRegion.x + '.' + this.mapState.currentRegion.y
  //     ];
  //   } else if (this.mapState.currentSector) {
  //     // sector
  //     if (!this.gameMap.store.sector) {
  //       this.gameMap.store.sector = {};
  //     }
  //     return this.gameMap.store.sector[
  //       this.mapState.currentRegion.x + '.' + this.mapState.currentRegion.y
  //     ];
  //   }
  // }

  async generateMap(level: string): Promise<MapSegmentData> {
    return new Promise<MapSegmentData>((resolve: any) => {
      let position = { x: 0, y: 0 };
      if (this.mapState.currentRegion && !this.mapState.currentSector) {
        position = {
          x: this.mapState.currentRegion.x * this.mapState.size,
          y: this.mapState.currentRegion.y * this.mapState.size,
        };
      } else if (this.mapState.currentRegion && this.mapState.currentSector) {
        position = {
          x: (this.mapState.currentRegion.x * this.mapState.size * 10) + (this.mapState.currentSector.x * this.mapState.size),
          y: (this.mapState.currentRegion.y * this.mapState.size * 10) + (this.mapState.currentSector.y * this.mapState.size),
        };
      }
      const mapGenerator = new MapGenerator();
      mapGenerator.postMessage({
        heightmap: {
          seed: this.mapState.seed,
          size: this.mapState.size,
          level,
          position,
          sealevel: SEALEVEL
        },
      });
      console.log('Map gen', level, position);
      mapGenerator.addEventListener('message', event => {
        const data: MapSegmentData = Object.create(null);
        data.level = level;
        data.stats = event.data.stats;
        data.heightmap = ndarray(event.data.heightmap, [this.mapState.size, this.mapState.size]);
        data.radiation = ndarray(event.data.radiation, [this.mapState.size, this.mapState.size]);
        data.rainfall = ndarray(event.data.rainfall, [this.mapState.size, this.mapState.size]);
        data.biome = ndarray(event.data.biome, [this.mapState.size, this.mapState.size]);
        Object.freeze(data);
        resolve(data);
      });
    });
  }

  renderMap() {
    console.log('rendering', this.currentSegment);
    if (!this.currentSegment) {
      console.warn('Cannot render, map is loading...');
      return;
    }
    return new Promise((resolve) => {
      const viewFn = VIEWS[this.mapState.view].fn;
      const imageData = this.mapBitmapData.context.createImageData(this.mapState.size, this.mapState.size);
      for (let x = 0; x < this.mapState.size; x++) {
        for (let y = 0; y < this.mapState.size; y++) {
          const [r, g, b, a] = viewFn({
            height: this.currentSegment.heightmap.get(x, y),
            radiation: this.currentSegment.radiation.get(x, y),
            rainfall: this.currentSegment.rainfall.get(x, y),
            biome: this.currentSegment.biome.get(x, y),
            sealevel: SEALEVEL,
          });
          const index = (x + y * this.mapState.size) * 4;
          imageData.data[index + 0] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = (a || 1) * 255;
        }
      }
      this.mapBitmapData.context.fillRect(0, 0, this.mapState.size, this.mapState.size);
      this.mapBitmapData.context.putImageData(imageData, 0, 0);
      this.mapBitmapData.dirty = true;
      resolve();
    });
  }

  updateCursor() {
    console.log('update cursor');
    if (this.mapState.cursor) {
      this.mapCursorSprite.visible = true;
      this.mapCursorSprite.left = this.mapState.cursor.x * this.cellWidth;
      this.mapCursorSprite.top = this.mapState.cursor.y * this.cellHeight;
    } else {
      this.mapCursorSprite.visible = false;
    }

    // if (this.mapState.currentRegion) {
    //   this.mapCursorSprite.left = this.mapState.currentRegion.x * this.cellWidth;
    //   this.mapCursorSprite.top = this.mapState.currentRegion.y * this.cellHeight;
    //   this.mapCursorSprite.alpha = 1;
    // } if (this.mapState.currentSector) {
    //   this.mapCursorSprite.left = this.mapState.currentSector.x * this.cellWidth;
    //   this.mapCursorSprite.top = this.mapState.currentSector.y * this.cellHeight;
    //   this.mapCursorSprite.alpha = 1;
    // }
  }

  get activeRegionOffset() {
    return {
      x: this.mapState.currentRegion.x * this.mapState.size,
      y: this.mapState.currentRegion.y * this.mapState.size,
    };
  }

  // get activeSectorOffset() {
  //   return {
  //     x: (this.mapState.currentRegion.x * this.mapState.size * 10) + (this.activeSector.x * this.mapState.size),
  //     y: (this.mapState.currentRegion.y * this.mapState.size * 10) + (this.activeSector.y * this.mapState.size),
  //   };
  // }

  newMap() {
    this.gameMap = blankGameMap;
    this.regen();
  }

  /**
   * Regenerates the current level and all above it
   */
  regen() {
    if (!this.mapState.currentRegion) {
      // regen world

      if (this.gameMap.store.world) {
        this.currentSegment = this.gameMap.store.world;
        this.renderMap();
      } else {
        this.gameMap.store.world = null;
        this.generateMap('world')
          .then(((data: MapSegmentData) => {
            console.log('generate world map', data);
            this.gameMap.store.world = data;
            this.currentSegment = data;
            this.renderMap();
          }));
      }
    } else if (this.mapState.currentRegion && !this.mapState.currentSector) {
      // regen world and region
      if (this.gameMap.store.region) {
        this.currentSegment = this.gameMap.store.region[
          this.mapState.currentRegion.x + '.' + this.mapState.currentRegion.y
        ];
        this.renderMap();
      } else {
        this.gameMap.store.region = {};
        this.generateMap('region')
          .then(((data: MapSegmentData) => {
            console.log('generate region map')
            this.gameMap.store.region[
              this.mapState.currentRegion.x + '.' + this.mapState.currentRegion.y
            ] = data;
            this.currentSegment = data;
            this.renderMap();
          }));
      }
    } else if (this.mapState.currentSector) {
      // regen world, sector, and sector
      if (this.gameMap.store.sector) {
        this.currentSegment = this.gameMap.store.sector[
          this.mapState.currentSector.x + '.' + this.mapState.currentSector.y
        ];
        this.renderMap();
      } else {
        this.gameMap.store.sector = {};
        this.generateMap('sector')
          .then(((data: MapSegmentData) => {
            console.log('generate sector map')
            this.gameMap.store.sector[
              this.mapState.currentSector.x + '.' + this.mapState.currentSector.y
            ] = data;
            this.currentSegment = data;
            this.renderMap();
          }));
      }
    }
    // Promise.all([
    //   this.generateMap('world'),
    //   // this.generateMap('region', this.activeRegionOffset),
    //   // this.generateMap('sector', this.activeSectorOffset)
    // ])
    //   .then(([worldData, regionData, sectorData]) => {
    //     // this.regionData = regionData;
    //     // this.sectorData = sectorData;
    //     this.renderMap(this.mapData, this.mapBitmapData);
    //   });
  }

  setupKeyboard() {
    // keyboard
    const keys = this.game.input.keyboard.addKeys({
      map: Phaser.Keyboard.M,
      refresh: Phaser.Keyboard.R,
      grid: Phaser.Keyboard.G,
      view: Phaser.Keyboard.V,
      esc: Phaser.Keyboard.ESC,
    });
    keys.map.onUp.add(() => {
      console.log('Go to Game');
      this.state.start('Game');
    });
    keys.grid.onUp.add(() => {
      console.log('hide grid');
      store.dispatch(toggleGrid());
    });
    keys.view.onUp.add(() => {
      console.log('change view');
      store.dispatch(setView((this.mapState.view + 1) % VIEWS.length));
    });
    keys.refresh.onUp.add(() => {
      console.log('refresh');
      store.dispatch(setMapSeed(Math.random()));
      this.regen();
    });
    keys.esc.onUp.add(() => {
      store.dispatch(moveCursor(null));
    });
  }

  onClickGrid(cx: number, cy: number) {
    console.log(`Clicked on region ${cx}, ${cy}`);
    const coordinate = new Phaser.Point(cx, cy);

    if (this.mapState.cursor && this.mapState.cursor.equals(coordinate)) {
      store.dispatch(moveCursor(null));
    } else {
      store.dispatch(moveCursor(coordinate));
    }
    // if (!this.mapState.currentRegion) {
    //   store.dispatch(selectRegion(coordinate));
    // } else if (!this.mapState.currentSector) {
    //   store.dispatch(selectSector(coordinate));
    // }

    // this.updateCursor();
    // Promise.all([
    //   this.generateMap('region', this.activeRegionOffset),
    //   this.generateMap('sector', this.activeSectorOffset)
    // ])
    //   .then(([regionData, sectorData]) => {
    //     this.regionData = regionData;
    //     this.sectorData = sectorData;
    //     this.renderMap(regionData, this.regionMapData);
    //   });
  }

  async create() {
    this.setupKeyboard();

    const ui = this.game.add.group();
    this.game.camera.bounds = null;

    this.mapBitmapData = this.game.add.bitmapData(this.mapState.size, this.mapState.size);

    this.regen();

    // world map sprite
    this.mapSprite = this.game.add.sprite(0, 0, this.mapBitmapData);
    this.mapSprite.width = 1000;
    this.mapSprite.height = 1000;
    this.mapSprite.smoothed = false;

    ui.add(this.mapSprite);

    // world map grid
    this.cellWidth = Math.round((this.mapSprite.width) / this.regionScale);
    this.cellHeight = Math.round((this.mapSprite.height) / this.regionScale);
    const gridMap = this.game.add.bitmapData(this.mapSprite.width, this.mapSprite.height);
    for (let x = 0; x <= this.mapSprite.width; x++) {
      gridMap.line(Math.round(x * this.cellWidth), 0, Math.round(x * this.cellWidth), this.mapSprite.height, '#000');
      for (let y = 0; y <= this.mapSprite.height; y++) {
        gridMap.line(0, Math.round(y * this.cellHeight), this.mapSprite.width, Math.round(y * this.cellHeight), '#000');
      }
    }
    this.mapGrid = this.game.add.sprite(0, 0, gridMap);
    this.mapGrid.smoothed = false;
    this.mapGrid.inputEnabled = true;
    this.mapGrid.name = 'MapGrid';
    // this.mapGrid.pixelPerfectClick = true;
    this.mapGrid.events.onInputDown.add((sprite, pointer) => {
      let { x, y, width, height } = sprite.getBounds();
      let row = Math.floor((pointer.x - x) * this.regionScale / width);
      let column = Math.floor((pointer.y - y) * this.regionScale / height);
      this.onClickGrid(row, column);
    });

    ui.add(this.mapGrid);

    // world map cursor
    const mapCursorData = this.game.add.bitmapData(this.cellWidth, this.cellHeight);
    Phaser.Canvas.setSmoothingEnabled(mapCursorData.context, false);
    mapCursorData.context.strokeStyle = '#FF0000';
    mapCursorData.context.rect(
      0,
      0,
      this.cellWidth,
      this.cellHeight,
    );
    mapCursorData.context.lineWidth = 3;
    mapCursorData.context.stroke();
    this.mapCursorSprite = this.game.add.sprite(0, 0, mapCursorData);
    this.mapCursorSprite.width = this.cellWidth;
    this.mapCursorSprite.height = this.cellHeight;
    this.mapCursorSprite.visible = false;
    
    this.updateCursor();

    // move the map to the center of the screen
    const mapGroup = this.game.add.group();
    mapGroup.add(this.mapSprite);
    mapGroup.add(this.mapGrid);
    mapGroup.add(this.mapCursorSprite);
    mapGroup.centerX = window.innerWidth / 2;
    mapGroup.centerY = window.innerHeight / 2;

    // set up movement cursors
    this.cursors = this.game.input.keyboard.addKeys({
      'up': Phaser.KeyCode.W,
      'down': Phaser.KeyCode.S,
      'left': Phaser.KeyCode.A,
      'right': Phaser.KeyCode.D
    });
  }

  update() {
    const gridAlpha = this.mapState.showGrid ? 1 : 0;
    this.mapGrid.alpha = gridAlpha;

    if (this.mapState.cursor) {
      this.mapCursorSprite.visible = true;
    }

    // camera move
    if (this.cursors.left.isDown) {
      this.game.camera.x -= 8;
    } else if (this.cursors.right.isDown) {
      this.game.camera.x += 8;
    }

    if (this.cursors.up.isDown) {
      this.game.camera.y -= 8;
    } else if (this.cursors.down.isDown) {
      this.game.camera.y += 8;
    }
  }
}
