import * as Phaser from 'phaser-ce';

export default class Boot extends Phaser.State {
  init () {
    this.stage.backgroundColor = '#2d2d2d';
  }

  preload () {
    this.load.image('loaderBg', './assets/images/loader-bg.png');
    this.load.image('loaderBar', './assets/images/loader-bar.png');
  }

  render () {
    this.state.start('Splash');
  }
}
