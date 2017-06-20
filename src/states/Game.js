/* globals __DEV__ */
import Phaser from 'phaser';

export default class Game extends Phaser.State {
  init () {}
  preload () {}

  create () {

    // this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    // this.game.scale.setUserScale(3, 3);
    this.game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);

    this.game.camera.bounds = null;
    this.map = this.game.add.tilemap(null, 16, 16);
    this.map.addTilesetImage('terrain-map');
    this.layer1 = this.map.create('layer1', 100, 100, 16, 16);
    this.layer2 = this.map.createBlankLayer('layer2', 100, 100, 16, 16);
    this.layer1.scale.set(2);
    this.layer1.smoothed = false;
    this.layer2.scale.set(2);
    this.layer2.smoothed = false;

    for (let x = 0; x < 100; x++) {
      for (let y = 0; y < 100; y++) {
        const tile = this.game.rnd.integerInRange(0, 16);
        this.map.putTile(tile, x, y, 'layer1');
      }
    }

    this.map.putTile(18, 10, 10);
    this.map.putTile(22, 11, 10);

    this.layer1.resizeWorld();
    this.layer2.resizeWorld();
    this.cursors = this.game.input.keyboard.addKeys({
      'up': Phaser.KeyCode.W,
      'down': Phaser.KeyCode.S,
      'left': Phaser.KeyCode.A,
      'right': Phaser.KeyCode.D
    });

    const mapKey = this.game.input.keyboard.addKey(Phaser.Keyboard.M);
    mapKey.onUp.add(() => {
      this.state.start('Map');
    });
  }

  update() {
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
