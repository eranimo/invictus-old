import { Game, State, Sprite, Point} from 'phaser-ce';
import ndarray from 'ndarray';
import { VIEWS, View } from './map/views';
import { SIZES } from './map/sizes';
import renderUI, {
  store,
  runSaga,
} from './map/ui';
import {
  setView,
  setMapSeed,
  setMapSize,
  toggleGrid,
  selectRegion,
  selectSector,
  moveCursor,
  setLoading,
  toggleKeyboardHelp,

  MOVE_CURSOR,
  SET_VIEW,
} from './map/ui/redux';
import { UIState } from './map/ui/redux';
import { takeLatest } from 'redux-saga/effects';
import { BIOMES } from 'mapgen/biomes';
import MapManager, { MapSegmentData, MapLevels } from './map/mapManager';


const VIEW_SIZE = 1000;
const SEALEVEL = 150;

export default class Map extends State {
  views: Array<View>;
  regionScale: number;
  regionSize: number;
  
  mapBitmapData: Phaser.BitmapData; // map image bitmap

  mapSprite: Sprite;
  mapCursorSprite: Sprite;
  mapGrid: Sprite;

  cellWidth: number;
  cellHeight: number;

  cursors: any;

  mapManager: MapManager;
  currentSegment: MapSegmentData;
  mapState: UIState;

  redrawGrid: boolean;
  hoverPoint: Point;
  hoverText: Phaser.Text;

  init() {
    this.stage.backgroundColor = '#2d2d2d';
    this.regionScale = 10;

    // this.world.scale.set(1000 / 900);

    this.mapManager = new MapManager({
      onGenerate: (segment: MapSegmentData) => {
        this.currentSegment = segment;
        store.dispatch(setLoading(false));
        this.renderMap();
      }
    });

    this.mapState = store.getState();
    store.subscribe(() => {
      this.mapState = store.getState();
    });

    const self = this;
    runSaga(function *mainSaga() {
      yield [
        takeLatest([
          MOVE_CURSOR,
        ], function *moveCursorSaga() {
          console.log('move cursor saga');
          self.updateCursor();
        }),

        takeLatest([
          SET_VIEW,
        ], function *updateMap() {
          console.log('render map saga');
          self.renderMap();
        }),
      ];
    });

    this.regionSize = this.mapState.size / this.regionScale;

    renderUI({
      save: () => console.log('save map'),
      regen: (shouldClear) => {
        console.log('regen map');
        if (shouldClear) {
          this.clearMap();
        } else {
          this.fetchMap();
        }
      },
    });

  }

  fetchMap() {
    store.dispatch(setLoading(true));
    if (!this.mapState.currentRegion) {
      // regen world
      this.mapManager.fetchMap(MapLevels.world);
    } else if (this.mapState.currentRegion && !this.mapState.currentSector) {
      // regen world and region
      this.mapManager.fetchMap(MapLevels.region, this.mapState.currentRegion);
    } else if (this.mapState.currentSector) {
      // regen world, sector, and sector
      this.mapManager.fetchMap(MapLevels.region, this.mapState.currentSector);
    }
  }

  get hoverPointInfo() {
    const { x, y } = this.hoverPoint;
    const cx: number = Math.round((x / VIEW_SIZE) * this.mapState.size);
    const cy: number = Math.round((y / VIEW_SIZE) * this.mapState.size);

    return {
      cx, cy,
      height: this.currentSegment.heightmap.get(cx, cy),
      radiation: this.currentSegment.radiation.get(cx, cy),
      rainfall: this.currentSegment.rainfall.get(cx, cy),
      biome: this.currentSegment.biome.get(cx, cy),
    };
  }

  renderMap() {
    console.log('rendering', this.currentSegment);
    const size = this.mapManager.gameMap.settings.size;

    if (!this.currentSegment) {
      console.warn('Cannot render, map is loading...');
      return;
    }
    return new Promise((resolve) => {
      const viewFn = VIEWS[this.mapState.view].fn;
      const imageData = this.mapBitmapData.context.createImageData(size, size);
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const [r, g, b, a] = viewFn({
            height: this.currentSegment.heightmap.get(x, y),
            radiation: this.currentSegment.radiation.get(x, y),
            rainfall: this.currentSegment.rainfall.get(x, y),
            biome: this.currentSegment.biome.get(x, y),
            sealevel: this.mapManager.gameMap.settings.sealevel,
          });
          const index = (x + y * size) * 4;
          imageData.data[index + 0] = r;
          imageData.data[index + 1] = g;
          imageData.data[index + 2] = b;
          imageData.data[index + 3] = (a || 1) * 255;
        }
      }
      this.mapBitmapData.clear();
      // const { mapSpriteSize, mapScale } = SIZES.find(i => i.size === size)
      this.mapBitmapData.context.putImageData(imageData, 0, 0);
      this.mapBitmapData.dirty = true;
      const scale = VIEW_SIZE / size;
      this.mapBitmapData.context.scale(scale, scale);
      this.mapSprite.scale.set(scale);
      // this.mapSprite.width = size;
      // this.mapSprite.height = size;
      console.log('mapBitmapData', this.mapBitmapData);

      if (this.redrawGrid) {
        console.log('redraw grid!');
      }
      resolve();
    });
  }

  updateCursor() {
    console.log('update cursor');
    if (this.mapState.cursor) {
      this.mapCursorSprite.visible = true;
      this.mapCursorSprite.left = this.mapState.cursor.x * this.cellWidth;
      this.mapCursorSprite.top = this.mapState.cursor.y * this.cellHeight;
    } else {
      this.mapCursorSprite.visible = false;
    }
  }

  clearMap() {
    this.mapManager.reset();
    this.fetchMap();
  }

  setupKeyboard() {
    // keyboard
    const keys = this.game.input.keyboard.addKeys({
      map: Phaser.Keyboard.M,
      refresh: Phaser.Keyboard.R,
      grid: Phaser.Keyboard.G,
      view: Phaser.Keyboard.V,
      esc: Phaser.Keyboard.ESC,
      help: Phaser.Keyboard.QUESTION_MARK,
    });
    keys.map.onUp.add(() => {
      console.log('Go to Game');
      this.state.start('Game');
    });
    keys.grid.onUp.add(() => {
      console.log('hide grid');
      store.dispatch(toggleGrid());
    });
    keys.view.onUp.add(() => {
      console.log('change view');
      store.dispatch(setView((this.mapState.view + 1) % VIEWS.length));
    });
    keys.refresh.onUp.add(() => {
      console.log('refresh');
      store.dispatch(setMapSeed(Math.random()));
      this.clearMap();
    });
    keys.esc.onUp.add(() => {
      store.dispatch(moveCursor(null));
    });
    keys.help.onUp.add(() => {
      store.dispatch(toggleKeyboardHelp());
    });
  }

  onClickGrid(cx: number, cy: number) {
    console.log(`Clicked on region ${cx}, ${cy}`);
    const coordinate = new Phaser.Point(cx, cy);

    if (this.mapState.cursor && this.mapState.cursor.equals(coordinate)) {
      store.dispatch(moveCursor(null));
    } else {
      store.dispatch(moveCursor(coordinate));
    }
  }

  create() {
    this.setupKeyboard();

    const ui = this.game.add.group();
    this.game.camera.bounds = null;

    this.mapBitmapData = this.game.add.bitmapData(this.mapState.size, this.mapState.size);

    this.fetchMap();

    // world map sprite
    this.mapSprite = this.game.add.sprite(0, 0, this.mapBitmapData);
    this.mapSprite.width = VIEW_SIZE;
    this.mapSprite.height = VIEW_SIZE;
    this.mapSprite.smoothed = false;

    ui.add(this.mapSprite);

    // world map grid
    this.cellWidth = Math.round((this.mapSprite.width) / this.regionScale);
    this.cellHeight = Math.round((this.mapSprite.height) / this.regionScale);
    const gridMap = this.game.add.bitmapData(this.mapSprite.width, this.mapSprite.height);
    for (let x = 0; x <= this.mapSprite.width; x++) {
      gridMap.line(Math.round(x * this.cellWidth), 0, Math.round(x * this.cellWidth), this.mapSprite.height, '#000');
      for (let y = 0; y <= this.mapSprite.height; y++) {
        gridMap.line(0, Math.round(y * this.cellHeight), this.mapSprite.width, Math.round(y * this.cellHeight), '#000');
      }
    }
    this.mapGrid = this.game.add.sprite(0, 0, gridMap);
    this.mapGrid.smoothed = false;
    this.mapGrid.inputEnabled = true;
    this.mapGrid.name = 'MapGrid';
    // this.mapGrid.pixelPerfectClick = true;
    this.mapGrid.events.onInputDown.add((sprite, pointer) => {
      let { x, y, width, height } = sprite.getBounds();
      let row = Math.floor((pointer.x - x) * this.regionScale / width);
      let column = Math.floor((pointer.y - y) * this.regionScale / height);
      this.onClickGrid(row, column);
    });

    ui.add(this.mapGrid);

    // world map cursor
    const mapCursorData = this.game.add.bitmapData(this.cellWidth, this.cellHeight);
    Phaser.Canvas.setSmoothingEnabled(mapCursorData.context, false);
    mapCursorData.context.strokeStyle = '#FF0000';
    mapCursorData.context.rect(
      0,
      0,
      this.cellWidth,
      this.cellHeight,
    );
    mapCursorData.context.lineWidth = 3;
    mapCursorData.context.stroke();
    this.mapCursorSprite = this.game.add.sprite(0, 0, mapCursorData);
    this.mapCursorSprite.width = this.cellWidth;
    this.mapCursorSprite.height = this.cellHeight;
    this.mapCursorSprite.visible = false;
    
    this.updateCursor();

    // move the map to the center of the screen
    const mapGroup = this.game.add.group();
    mapGroup.add(this.mapSprite);
    mapGroup.add(this.mapGrid);
    mapGroup.add(this.mapCursorSprite);
    mapGroup.centerX = window.innerWidth / 2;
    mapGroup.centerY = window.innerHeight / 2;

    // set up movement cursors
    this.cursors = this.game.input.keyboard.addKeys({
      'up': Phaser.KeyCode.W,
      'down': Phaser.KeyCode.S,
      'left': Phaser.KeyCode.A,
      'right': Phaser.KeyCode.D
    });

    this.hoverText = this.game.add.text(10, 10, '', {
      font: '12px Arial',
      fill: '#CED9E0',
      align: 'left',
    });
    this.hoverText.fixedToCamera = true;
    this.hoverText.cameraOffset.setTo(10, 10);
  }

  update() {
    // this.game.debug.spriteInfo(this.mapSprite, 50, 50);
    const gridAlpha = this.mapState.showGrid ? 1 : 0;
    this.mapGrid.alpha = gridAlpha;

    // hover pointer
    let { x, y, width, height } = this.mapGrid.getBounds();
    this.hoverPoint = new Point(
      this.game.input.mousePointer.x - x,
      this.game.input.mousePointer.y - y
    );

    if (this.hoverPoint && this.currentSegment) {
      if (this.hoverPointInfo.height) {
        this.hoverText.setText(`
          Location: (${this.hoverPointInfo.cx}, ${this.hoverPointInfo.cy})
Height: ${this.hoverPointInfo.height}
Altitude: ${this.hoverPointInfo.height - SEALEVEL}
Type: ${this.hoverPointInfo.height < SEALEVEL ? 'Water' : 'Land'}
Biome: ${BIOMES[this.hoverPointInfo.biome].title}
Radiation: ${this.hoverPointInfo.radiation}
Rainfall: ${this.hoverPointInfo.rainfall}
        `.trim());
      } else {
        this.hoverText.setText('');
      }
    }
    

    if (this.mapState.cursor) {
      this.mapCursorSprite.visible = true;
    }

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
