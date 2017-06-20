import Phaser from 'phaser';
import SimplexNoise from 'simplex-noise';
import Alea from 'alea';
import { time } from 'core-decorators';


export default class Map extends Phaser.State {
  init() {
    this.stage.backgroundColor = '#2d2d2d';
    this.size = 300;
  }

  @time
  generateMap() {
    const rng = new Alea();
    const simplex = new SimplexNoise(rng);
    const freq1 = 1;
    const freq2 = 2;
    const freq3 = 6;
    const noise = (nx, ny) => simplex.noise2D(nx, ny) / 2 + 0.5;
    const heightFunc = (nx, ny) => {
      const e = 1.00 * noise(nx * freq1, ny * freq1)
              + 0.80 * noise(nx * freq2, ny * freq2)
              + 0.25 * noise(nx * freq3, ny * freq3);
      return e;
    };

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const nx = x / this.size - 0.5;
        const ny = y / this.size - 0.5;
        let height = heightFunc(nx, ny) * 128;
        height = Math.min(Math.max(height, 0), 255);
        height = Math.ceil(height / 10) * 10;
        this.mapData.setPixel(x, y, height, height, height, false);
      }
    }

    this.mapData.context.putImageData(this.mapData.imageData, 0, 0);
    this.mapData.dirty = true;
  }

  create() {
    // go back to the game
    const mapKey = this.game.input.keyboard.addKey(Phaser.Keyboard.M);
    const refreshKey = this.game.input.keyboard.addKey(Phaser.Keyboard.R);
    mapKey.onUp.add(() => {
      this.state.start('Game');
    });

    this.mapData = this.game.add.bitmapData(this.size, this.size);
    this.generateMap();

    this.map = this.game.add.sprite(100, 100, this.mapData);
    this.map.smoothed = false;
    this.map.scale.set(2);

    refreshKey.onUp.add(() => {
      this.generateMap();
    });
  }
}
