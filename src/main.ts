import 'pixi';
import 'p2';
import * as Phaser from 'phaser-ce';

import BootState from './states/Boot';
import SplashState from './states/Splash';
import GameState from './states/Game';
import MapState from './states/Map';

import config from './config';
import './style.scss';


const UI_TOP_PX = 50;

class Game extends Phaser.Game {
  constructor () {
    const docElement = document.documentElement;
    const width = docElement.clientWidth > config.gameWidth ? config.gameWidth : docElement.clientWidth;
    const height = docElement.clientHeight > config.gameHeight ? config.gameHeight : docElement.clientHeight;

    super(width, height - UI_TOP_PX, Phaser.WEBGL, 'gameCanvas', null);

    this.state.add('Boot', BootState, false);
    this.state.add('Splash', SplashState, false);
    this.state.add('Game', GameState, false);
    this.state.add('Map', MapState, false);
    this.state.start('Boot');   
    

    const topUI = document.createElement('div');
    topUI.id = 'topUI';
    topUI.classList.add('pt-dark');
    document.body.appendChild(topUI);

    window.addEventListener('resize', this.updateGameSize.bind(this), true);
    window.addEventListener('touchmove', this.updateGameSize.bind(this), true);
  }

  updateGameSize() {
    console.log('resize');
    this.scale.setGameSize(window.innerWidth, window.innerHeight - UI_TOP_PX);
  }
}

// ign
(window as any).game = new Game();
