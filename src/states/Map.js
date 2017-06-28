import Phaser from 'phaser';
import SimplexNoise from 'simplex-noise';
import Alea from 'alea';
import { time } from 'core-decorators';
import MapGenerator from 'worker-loader!../workers/mapGenerator';
import ndarray from 'ndarray';


const contour = (value, c = 10) => Math.ceil(value / c) * c;
const coastline = value => value < 200 ? 0 : 255;


export default class Map extends Phaser.State {
  init() {
    this.stage.backgroundColor = '#2d2d2d';
    this.size = 250;
    this.regionScale = 10;
    this.regionSize = this.size / this.regionScale;
    this.seed = Math.random();
    this.activeRegion = {
      x: 0,
      y: 0,
    };
    this.uiScale = 2;
    this.gridAlpha = 1;
    this.activeView = 0;
    this.views = [
      {
        name: 'Heightmap',
        fn: (height) => contour(height, 10),
      },
      {
        name: 'Sea Level',
        fn: (height) => coastline(height),
      }
    ];
    console.log(this);

    this.mapLevels = {
      world: null,
      region: null,
    };
  }

  @time
  async generateMap(level, offset) {
    return new Promise((resolve) => {
      const mapGenerator = new MapGenerator();
      mapGenerator.postMessage({
        heightmap: {
          seed: this.seed,
          size: this.size,
          level,
          offset: offset && {
            x: offset.x * this.size,
            y: offset.y * this.size,
          },
        },
      });
      mapGenerator.addEventListener('message', event => {
        const heightmap = ndarray(event.data.heightmap, [this.size, this.size]);

        console.log('D', event.data);

        resolve(heightmap);
      });
    });
  }

  @time
  renderMap(data, bitmapData) {
    return new Promise((resolve) => {
      const viewFn = this.views[this.activeView].fn;
      const imageData = bitmapData.context.createImageData(this.size, this.size);
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          const height = viewFn(data.get(x, y));
          const index = (x + y * this.size) * 4;
          imageData.data[index + 0] = height;
          imageData.data[index + 1] = height;
          imageData.data[index + 2] = height;
          imageData.data[index + 3] = height;
        }
      }

      bitmapData.context.putImageData(imageData, 0, 0);
      bitmapData.dirty = true;
      resolve();
    });
  }

  makeGrid(mask, cells) {
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
    return gridSprite;
  }

  updateRegionCursor() {
    this.worldMapCursor.left = this.activeRegion.x * (this.regionSize * this.uiScale);
    this.worldMapCursor.top = this.activeRegion.y * (this.regionSize * this.uiScale);
  }

  regen() {
    Promise.all([
      this.generateMap('world'),
      this.generateMap('region', this.activeRegion)
    ])
      .then(([worldData, regionData]) => {
        this.renderMap(worldData, this.worldMapData);
        this.renderMap(regionData, this.regionMapData);
      });
  }

  async create() {
    // go back to the game
    const ui = this.game.add.group();
    ui.smoothed = false;
    this.game.camera.bounds = null;

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
      this.activeView = (this.activeView + 1) % this.views.length;
      this.regen();
    });

    this.worldMapData = this.game.add.bitmapData(this.size, this.size);
    this.regionMapData = this.game.add.bitmapData(this.size, this.size);

    this.regen();

    this.worldMap = this.game.add.sprite(0, 0, this.worldMapData);
    this.worldMap.smoothed = false;
    ui.add(this.worldMap);
    this.worldMap.scale.set(this.uiScale);

    const worldMapGrid = this.makeGrid(this.worldMap, this.regionScale);
    this.worldMapGrid = worldMapGrid;
    worldMapGrid.events.onInputDown.add(() => {
      const input = worldMapGrid.input;
      const cx = Math.floor(input.pointerX() / (this.regionSize * 2));
      const cy = Math.floor(input.pointerY() / (this.regionSize * 2));
      this.activeRegion.x = cx;
      this.activeRegion.y = cy;
      this.updateRegionCursor();
      this.generateMap('region', this.activeRegion)
        .then(regionData => {
          this.renderMap(regionData, this.regionMapData);
        });
    });
    worldMapGrid.inputEnabled = true;
    worldMapGrid.pixelPerfectClick = true;
    worldMapGrid.useHandCursor = true;
    ui.add(worldMapGrid);

    this.regionMap = this.game.add.sprite(this.worldMap.width + 10, 0, this.regionMapData);
    this.regionMap.scale.set(this.uiScale);
    this.regionMap.smoothed = false;
    const regionMapGrid = this.makeGrid(this.regionMap, this.regionScale);
    this.regionMapGrid = regionMapGrid;
    ui.add(this.regionMap);

    keys.refresh.onUp.add(() => {
      this.seed = Math.random();
      this.regen();
    });

    const cursorMap = this.game.add.bitmapData(this.size, this.size);
    cursorMap.context.strokeStyle = '#FF0000';
    cursorMap.context.rect(
      2,
      2,
      (this.regionSize * this.uiScale) - 2,
      (this.regionSize * this.uiScale) - 3,
    );
    cursorMap.context.stroke();
    this.worldMapCursor = this.game.add.sprite(0, 0, cursorMap);
    ui.add(this.worldMapCursor);
    this.updateRegionCursor();
  }

  update() {
    this.worldMapGrid.alpha = this.gridAlpha;
    this.regionMapGrid.alpha = this.gridAlpha;
  }
}
