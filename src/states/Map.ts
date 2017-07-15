import { Game, State, Sprite } from 'phaser-ce';
//import { time } from 'core-decorators';
import * as MapGenerator from 'worker-loader!../workers/worldMapGenerator';
import ndarray from 'ndarray';
import { VIEWS, View } from './map/views';
import renderUI from './map/ui';


const SEALEVEL = 150;

interface Coordinate {
  x: number,
  y: number
}

export default class Map extends State {
  views: Array<View>;
  size: number;
  seed: number;
  regionScale: number;
  regionSize: number;
  activeRegion: Coordinate;
  activesector: Coordinate;
  uiScale: number;
  gridAlpha: number;
  activeView: number;
  
  worldData: Object;
  regionData: Object;
  sectorData: Object;

  worldMapData: Object;
  regionMapData: Object;
  sectorMapData: Object;

  worldMap: Sprite;
  regionMap: Sprite;
  sectorMap: Sprite;

  worldMapCursor: Sprite;
  regionMapCursor: Sprite;

  worldMapGrid: Sprite;
  regionMapGrid: Sprite;
  sectorMapGrid: Sprite;

  cursors: any;

  init() {
    this.stage.backgroundColor = '#2d2d2d';
    this.size = 250;
    this.seed = Math.random();
    this.regionScale = 10;
    this.regionSize = this.size / this.regionScale;
    this.activeRegion = { x: 0, y: 0 };
    this.activesector = { x: 0, y: 0 };
    this.uiScale = 2;
    this.gridAlpha = 0;
    this.activeView = 3;
  }

  async generateMap(level, position = { x: 0, y: 0 }) {
    return new Promise((resolve) => {
      const mapGenerator = new MapGenerator();
      mapGenerator.postMessage({
        heightmap: {
          seed: this.seed,
          size: this.size,
          level,
          position,
          sealevel: SEALEVEL
        },
      });
      mapGenerator.addEventListener('message', event => {
        const data = Object.create(null);
        data.level = level;
        data.stats = event.data.stats;
        data.heightmap = ndarray(event.data.heightmap, [this.size, this.size]);
        data.radiation = ndarray(event.data.radiation, [this.size, this.size]);
        data.rainfall = ndarray(event.data.rainfall, [this.size, this.size]);
        data.biome = ndarray(event.data.biome, [this.size, this.size]);
        Object.freeze(data);
        resolve(data);
      });
    });
  }

  renderMap(map, bitmapData) {
    return new Promise((resolve) => {
      const viewFn = VIEWS[this.activeView].fn;
      console.log(map);
      const imageData = bitmapData.context.createImageData(this.size, this.size);
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          const [r, g, b, a] = viewFn({
            height: map.heightmap.get(x, y),
            radiation: map.radiation.get(x, y),
            rainfall: map.rainfall.get(x, y),
            biome: map.biome.get(x, y),
            sealevel: SEALEVEL,
          });
          const index = (x + y * this.size) * 4;
          imageData.data[index + 0] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = (a || 1) * 255;
        }
      }

      bitmapData.context.putImageData(imageData, 0, 0);
      bitmapData.dirty = true;
      resolve();
    });
  }

  makeGrid(mask: Sprite, cells: number, onClickGrid?: (cx: number, cy: number) => void) {
    const width = mask.width;
    const height = mask.height;
    const cellSize = (width) / cells;
    const gridMap = this.game.add.bitmapData(width, height);
    for (let x = 0; x <= cells; x++) {
      gridMap.line(x * cellSize, 0, x * cellSize, height, '#000');
      for (let y = 0; y <= cells; y++) {
        gridMap.line(0, y * cellSize, width, y * cellSize, '#000');
      }
    }
    const gridSprite = this.game.add.sprite(mask.left, mask.top, gridMap);
    gridSprite.smoothed = false;
    gridSprite.inputEnabled = true;
    // gridSprite.pixelPerfectClick = true;
    gridSprite.events.onInputDown.add(() => {
      const cx = Math.floor(
        (gridSprite.input.pointerX() + this.game.camera.x) / (this.regionSize * 2)
      );
      const cy = Math.floor(
        (gridSprite.input.pointerY() + this.game.camera.y) / (this.regionSize * 2)
      );
      if (onClickGrid) {
        onClickGrid(cx, cy);
      }
    });
    return gridSprite;
  }

  updateRegionCursor() {
    this.worldMapCursor.left = this.activeRegion.x * (this.regionSize * this.uiScale);
    this.worldMapCursor.top = this.activeRegion.y * (this.regionSize * this.uiScale);
  }

  updatesectorCursor() {
    this.regionMapCursor.left = this.worldMap.width + 10 + this.activesector.x * (this.regionSize * this.uiScale);
    this.regionMapCursor.top = this.activesector.y * (this.regionSize * this.uiScale);
  }

  get activeRegionOffset() {
    return {
      x: this.activeRegion.x * this.size,
      y: this.activeRegion.y * this.size,
    };
  }

  get activesectorOffset() {
    return {
      x: (this.activeRegion.x * this.size * 10) + (this.activesector.x * this.size),
      y: (this.activeRegion.y * this.size * 10) + (this.activesector.y * this.size),
    };
  }

  regen() {
    Promise.all([
      this.generateMap('world'),
      this.generateMap('region', this.activeRegionOffset),
      this.generateMap('sector', this.activesectorOffset)
    ])
      .then(([worldData, regionData, sectorData]) => {
        this.worldData = worldData;
        this.regionData = regionData;
        this.sectorData = sectorData;
        this.renderMap(worldData, this.worldMapData);
        this.renderMap(regionData, this.regionMapData);
        this.renderMap(sectorData, this.sectorMapData);
      });
  }

  setupKeyboard() {
    // keyboard
    const keys = this.game.input.keyboard.addKeys({
      map: Phaser.Keyboard.M,
      refresh: Phaser.Keyboard.R,
      grid: Phaser.Keyboard.G,
      view: Phaser.Keyboard.V,
    });
    keys.map.onUp.add(() => {
      console.log('Go to Game');
      this.state.start('Game');
    });
    keys.grid.onUp.add(() => {
      console.log('hide grid');
      this.gridAlpha = this.gridAlpha ? 0 : 1;
    });
    keys.view.onUp.add(() => {
      console.log('change view');
      this.activeView = (this.activeView + 1) % VIEWS.length;
      this.renderMap(this.worldData, this.worldMapData);
      this.renderMap(this.regionData, this.regionMapData);
      this.renderMap(this.sectorData, this.sectorMapData);
    });
    keys.refresh.onUp.add(() => {
      console.log('refresh');
      this.seed = Math.random();
      this.regen();
    });
  }

  async create() {
    this.setupKeyboard();

    const ui = this.game.add.group();
    // ui.smoothed = false;
    this.game.camera.bounds = null;

    this.worldMapData = this.game.add.bitmapData(this.size, this.size);
    this.regionMapData = this.game.add.bitmapData(this.size, this.size);
    this.sectorMapData = this.game.add.bitmapData(this.size, this.size);

    this.regen();

    // world map sprite
    this.worldMap = this.game.add.sprite(0, 0, this.worldMapData);
    this.worldMap.smoothed = false;
    this.worldMap.scale.set(this.uiScale);

    // region map sprite
    this.regionMap = this.game.add.sprite(this.worldMap.width + 10, 0, this.regionMapData);
    this.regionMap.smoothed = false;
    this.regionMap.scale.set(this.uiScale);

    // sector map sprite
    this.sectorMap = this.game.add.sprite((2 * this.worldMap.width) + 20, 0, this.sectorMapData);
    this.sectorMap.smoothed = false;
    this.sectorMap.scale.set(this.uiScale);

    ui.add(this.worldMap);
    ui.add(this.regionMap);
    ui.add(this.sectorMap);

    // world map grid
    this.worldMapGrid = this.makeGrid(this.worldMap, this.regionScale, (cx, cy) => {
      console.log(`Clicked on region ${cx}, ${cy}`);
      this.activeRegion.x = cx;
      this.activeRegion.y = cy;
      this.updateRegionCursor();
      Promise.all([
        this.generateMap('region', this.activeRegionOffset),
        this.generateMap('sector', this.activesectorOffset)
      ])
        .then(([regionData, sectorData]) => {
          this.regionData = regionData;
          this.sectorData = sectorData;
          this.renderMap(regionData, this.regionMapData);
          this.renderMap(sectorData, this.sectorMapData);
        });
    });

    // region map grid
    this.regionMapGrid = this.makeGrid(this.regionMap, this.regionScale, (cx, cy) => {
      console.log(`Clicked on sector ${cx}, ${cy}`);
      this.activesector.x = cx;
      this.activesector.y = cy;
      this.updatesectorCursor();
      Promise.all([
        this.generateMap('region', this.activeRegionOffset),
        this.generateMap('sector', this.activesectorOffset)
      ])
        .then(([regionData, sectorData]) => {
          this.regionData = regionData;
          this.sectorData = sectorData;
          this.renderMap(regionData, this.regionMapData);
          this.renderMap(sectorData, this.sectorMapData);
        });
    });
    this.sectorMapGrid = this.makeGrid(this.sectorMap, this.regionScale);

    ui.add(this.worldMapGrid);
    ui.add(this.regionMapGrid);
    ui.add(this.sectorMapGrid);

    // world cursor
    const cursorMapWorld = this.game.add.bitmapData(this.size, this.size);
    cursorMapWorld.context.strokeStyle = '#FF0000';
    cursorMapWorld.context.rect(
      2,
      2,
      (this.regionSize * this.uiScale) - 2,
      (this.regionSize * this.uiScale) - 3,
    );
    cursorMapWorld.context.stroke();
    this.worldMapCursor = this.game.add.sprite(0, 0, cursorMapWorld);
    ui.add(this.worldMapCursor);
    this.updateRegionCursor();

    // region cursor
    const cursorMapRegion = this.game.add.bitmapData(this.size, this.size);
    cursorMapRegion.context.strokeStyle = '#FF0000';
    cursorMapRegion.context.rect(
      2,
      2,
      (this.regionSize * this.uiScale) - 2,
      (this.regionSize * this.uiScale) - 3,
    );
    cursorMapRegion.context.stroke();
    this.regionMapCursor = this.game.add.sprite(0, 0, cursorMapRegion);
    ui.add(this.regionMapCursor);
    this.updatesectorCursor();

    this.cursors = this.game.input.keyboard.addKeys({
      'up': Phaser.KeyCode.W,
      'down': Phaser.KeyCode.S,
      'left': Phaser.KeyCode.A,
      'right': Phaser.KeyCode.D
    });

    renderUI();
  }

  update() {
    this.worldMapGrid.alpha = this.gridAlpha;
    this.regionMapGrid.alpha = this.gridAlpha;
    this.sectorMapGrid.alpha = this.gridAlpha;

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
