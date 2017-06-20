import 'pixi';
import 'p2';
import Phaser from 'phaser';

import BootState from './states/Boot';
import SplashState from './states/Splash';
import GameState from './states/Game';
import MapState from './states/Map';

import config from './config';
import './style.css';

class Game extends Phaser.Game {
  constructor () {
    const docElement = document.documentElement;
    const width = docElement.clientWidth > config.gameWidth ? config.gameWidth : docElement.clientWidth;
    const height = docElement.clientHeight > config.gameHeight ? config.gameHeight : docElement.clientHeight;

    super(width, height, Phaser.WEBGL, 'content', null);

    this.state.add('Boot', BootState, false);
    this.state.add('Splash', SplashState, false);
    this.state.add('Game', GameState, false);
    this.state.add('Map', MapState, false);

    this.state.start('Boot');    
  }

  reload() {
    this.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.canvas);

    window.addEventListener('resize', this.updateGameSize.bind(this));
    window.addEventListener('touchmove', this.updateGameSize.bind(this));
  }

  updateGameSize() {
    this.scale.setGameSize(window.innerWidth, window.innerHeight);
  }
}

window.game = new Game();
