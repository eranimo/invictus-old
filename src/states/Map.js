import Phaser from 'phaser';
import SimplexNoise from 'simplex-noise';
import Alea from 'alea';
import { time } from 'core-decorators';


// https://cmaher.github.io/posts/working-with-simplex-noise/
const zoomableNoise = noise => (numIterations, nx, ny, persistence, scale) => {
  // persistence is the scale factor in each iteration
  let maxAmp = 0;
  let amp = 1; // relative importance of the octave in the sum of the octaves
  let freq = scale;
  let noiseValue = 0;
  const low = 0;
  const high = 255;

  // add successively smaller, higher-frequency terms
  for (let i = 0; i < numIterations; ++i) {
    noiseValue += noise(nx * freq, ny * freq) * amp;
    maxAmp += amp;
    amp *= persistence;
    freq *= 2;
  }

  // take the average value of the iterations
  noiseValue /= maxAmp;

  // normalize the result
  noiseValue = noiseValue * (high - low) / 2 + (high + low) / 2;

  return noiseValue;
};

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
    console.log(this);
  }

  @time
  makeMap() {
    const rng = new Alea(this.seed);
    const simplex = new SimplexNoise(rng);
    const noise = (nx, ny) => simplex.noise2D(nx, ny) / 2 + 0.5;

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const nx = x / this.size - 0.5;
        const ny = y / this.size - 0.5;
        let height = zoomableNoise(noise)(5, nx, ny, .55, 2);
        height = contour(height, 10);
        this.worldMapData.setPixel(x, y, height, height, height, false);
      }
    }

    this.worldMapData.context.putImageData(this.worldMapData.imageData, 0, 0);
    this.worldMapData.dirty = true;
  }

  @time
  makeRegion() {
    const rng = new Alea(this.seed);
    const simplex = new SimplexNoise(rng);
    const noise = (nx, ny) => simplex.noise2D(nx, ny) / 2 + 0.5;
    // region map
    const offsetX = this.size * this.activeRegion.x;
    const offsetY = this.size * this.activeRegion.y;
    for (let x = 0; x < this.regionSize * this.regionScale; x++) {
      for (let y = 0; y < this.regionSize * this.regionScale; y++) {
        const nx = ((x + offsetX) / this.regionScale) / this.size - 0.5;
        const ny = ((y + offsetY) / this.regionScale) / this.size - 0.5;
        let height = zoomableNoise(noise)(25, nx, ny, .6, 2);
        height = contour(height, 5);
        this.regionMapData.setPixel(x, y, height, height, height, false);
      }
    }

    this.regionMapData.context.putImageData(this.regionMapData.imageData, 0, 0);
    this.regionMapData.dirty = true;
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

  create() {
    // go back to the game
    const ui = this.game.add.group();
    ui.smoothed = false;
    this.game.camera.bounds = null;

    const keys = this.game.input.keyboard.addKeys({
      map: Phaser.Keyboard.M,
      refresh: Phaser.Keyboard.R,
      grid: Phaser.Keyboard.G,
    });
    keys.map.onUp.add(() => {
      console.log('Go to Game');
      this.state.start('Game');
    });
    keys.grid.onUp.add(() => {
      console.log('hide grid');
      this.gridAlpha = this.gridAlpha ? 0 : 1;
    });

    this.worldMapData = this.game.add.bitmapData(this.size, this.size);
    this.regionMapData = this.game.add.bitmapData(this.regionSize * this.regionScale, this.regionSize * this.regionScale);
    this.makeMap();
    this.makeRegion();

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
      this.makeRegion();
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
      this.makeMap();
      this.makeRegion();
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
