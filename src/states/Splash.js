import Phaser from 'phaser';
import { centerGameObjects } from '../utils';

export default class extends Phaser.State {
  init () {}

  preload () {
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBg');
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar');
    centerGameObjects([this.loaderBg, this.loaderBar]);

    this.load.setPreloadSprite(this.loaderBar);
    //
    // load your assets
    //
    this.load.image('mushroom', 'assets/images/mushroom2.png');
    this.load.image('terrain', 'assets/images/terrain.png');

    this.load.image('terrain-map', 'assets/images/sheet-1.png');
    this.load.tilemap('terrain-tiles', 'assets/images/sheet-1.json', null, Phaser.Tilemap.TILED_JSON);
  }

  create () {
    this.state.start('Game');
  }
}
