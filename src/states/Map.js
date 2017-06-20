import Phaser from 'phaser';
import SimplexNoise from 'simplex-noise';
import Alea from 'alea';
import { time } from 'core-decorators';


export default class Map extends Phaser.State {
  init() {
    this.stage.backgroundColor = '#2d2d2d';
    this.size = 300;
    this.regionScale = 10;
    this.regionSize = this.size / this.regionScale;
  }

  @time
  generateMap() {
    const rng = new Alea();
    const simplex = new SimplexNoise(rng);
    const noise = (nx, ny) => simplex.noise2D(nx, ny) / 2 + 0.5;

    const worldMapHeight = (nx, ny) => {
      const e = 1.00 * noise(nx * 1, ny * 1)
              + 0.80 * noise(nx * 2, ny * 2)
              + 0.20 * noise(nx * 6, ny * 6);
      return e;
    };

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const nx = x / this.size - 0.5;
        const ny = y / this.size - 0.5;
        let height = ((worldMapHeight(nx, ny) + 0.5) / 3.5) * 256;
        height = Math.min(Math.max(height, 0), 255);
        height = Math.ceil(height / 10) * 10;
        this.worldMapData.setPixel(x, y, height, height, height, false);
      }
    }

    this.worldMapData.context.putImageData(this.worldMapData.imageData, 0, 0);
    this.worldMapData.dirty = true;

    // region map
    const regionMapHeight = (nx, ny) => {
      return (0.5 * noise(nx * 20, ny * 20));
    };
    const offsetX = this.regionSize * 0;
    const offsetY = this.regionSize * 0;
    for (let x = 0; x < this.regionSize * this.regionScale; x++) {
      for (let y = 0; y < this.regionSize * this.regionScale; y++) {
        const nx = ((x + offsetX) / this.regionScale) / this.size - 0.5;
        const ny = ((y + offsetY) / this.regionScale) / this.size - 0.5;
        const e = worldMapHeight(nx, ny) + regionMapHeight(nx, ny);
        let height = (e / 3.5) * 256;
        height = Math.min(Math.max(height, 0), 255);
        height = Math.ceil(height / 10) * 10;
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
    this.game.add.sprite(mask.left, mask.top, gridMap);
  }

  create() {
    // go back to the game
    const mapKey = this.game.input.keyboard.addKey(Phaser.Keyboard.M);
    const refreshKey = this.game.input.keyboard.addKey(Phaser.Keyboard.R);
    mapKey.onUp.add(() => {
      this.state.start('Game');
    });

    this.worldMapData = this.game.add.bitmapData(this.size, this.size);
    this.regionMapData = this.game.add.bitmapData(this.regionSize * this.regionScale, this.regionSize * this.regionScale);
    this.generateMap();

    this.worldMap = this.game.add.sprite(100, 100, this.worldMapData);
    this.worldMap.smoothed = false;
    this.worldMap.scale.set(2);

    this.makeGrid(this.worldMap, this.regionScale);

    this.regionMap = this.game.add.sprite(100 + this.worldMap.width, 100, this.regionMapData);
    this.regionMap.smoothed = false;
    this.regionMap.scale.set(2);

    refreshKey.onUp.add(() => {
      this.generateMap();
    });
  }
}
