import React from 'react';
import ReactDOM from 'react-dom';
import {
  Popover,
  Button,
  Menu,
  MenuItem,
  Position,
  Checkbox,
  PopoverInteractionKind,
  InputGroup,
  Tooltip,
  Spinner
} from '@blueprintjs/core';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { createLogger } from 'redux-logger';
import { VIEWS } from './views';


export const SET_VIEW = 'SET_VIEW';
export const setView = (view: number) => ({ type: SET_VIEW, payload: view });

export const SET_MAP_SEED = 'SET_MAP_SEED';
export const setMapSeed = (seed: number) => ({ type: SET_MAP_SEED, payload: seed });

export const SET_MAP_SIZE = 'SET_MAP_SIZE';
export const setMapSize = (size: number) => ({ type: SET_MAP_SIZE, payload: size });

export const TOGGLE_GRID = 'TOGGLE_GRID';
export const toggleGrid = () => ({ type: TOGGLE_GRID });

export const SELECT_REGION = 'SELECT_REGION';
export const selectRegion = (coordinate: Phaser.Point) => ({ type: SELECT_REGION, payload: coordinate });

export const SELECT_SECTOR = 'SELECT_SECTOR';
export const selectSector = (coordinate: Phaser.Point) => ({ type: SELECT_SECTOR, payload: coordinate });

export const MOVE_CURSOR = 'MOVE_CURSOR';
export const moveCursor = (coordinate: Phaser.Point) => ({ type: MOVE_CURSOR, payload: coordinate });

export const SET_LOADING = 'SET_LOADING';
export const setLoading = (isLoading: boolean) => ({ type: SET_LOADING, payload: isLoading });

export const TOGGLE_KEYBOARD_HELP = 'TOGGLE_KEYBOARD_HELP';
export const toggleKeyboardHelp = () => ({ type: TOGGLE_KEYBOARD_HELP });

interface TopUIProps {
  view?: number

  // view options
  showGrid?: boolean,
  currentRegion?: Phaser.Point,
  currentSector?: Phaser.Point,
  cursor?: Phaser.Point,

  // map options
  seed?: number,
  size?: number,

  setView?: (view: number) => any,
  toggleGrid?: () => any,
  regen?: () => void,
  save?: () => void
  setMapSeed?: (seed: number) => void,
  setMapSize?: (size: number) => void,
  toggleKeyboardHelp?: () => any,
}

@connect(state => state, { setView, toggleGrid, setMapSeed, setMapSize, toggleKeyboardHelp})
class TopUI extends React.Component<TopUIProps, any> {

  renderViewMenu() {
    return (
      <Menu>
        {VIEWS.map((view, index) => (
          <MenuItem
            key={index}
            text={view.name}
            className={this.props.view === index ? 'pt-active' : ''}
            onClick={() => {
              this.props.setView(index);
            }}
          />
        ))}
      </Menu>
    );
  }

  renderMapOptions() {
    return (
      <div style={{ padding: '1rem' }}>
        <div className="pt-form-group">
          <label
            className="pt-label"
            htmlFor="map-size"
          >
            Size
          </label>
          <div className="pt-form-content full-width">
            <div className="pt-select pt-fill">
              <select
                id="map-size"
                dir="auto"
                onChange={e => this.props.setMapSize(parseInt(e.target.value, 10))}
                value={this.props.size}
              >
                <option value={100}>Small (100)</option>
                <option value={250}>Medium (250)</option>
                <option value={500}>Large (500)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="pt-form-group">
          <label
            className="pt-label"
            htmlFor="map-seed"
          >
            Seed
          </label>
          <div className="pt-form-content">
            <Tooltip content="Random seed" inline position={Position.RIGHT}>
              <InputGroup
                id="map-seed"
                type="number"
                placeholder="number"
                dir="auto"
                value={this.props.seed.toString()}
                onChange={e => this.props.setMapSeed(parseInt(e.target.value, 10))}
                rightElement={
                  <Button
                    className="pt-minimal"
                    iconName="random"
                    onClick={() => this.props.setMapSeed(Math.random())}
                  />
                }
              />
            </Tooltip>
          </div>
        </div>
        <Button
          iconName="refresh"
          className="pt-fill"
          onClick={this.props.regen}
        >
          Regenerate Map
        </Button>
      </div>
    )
  }

  render() {
    return (
      <div className="top-ui">
        <nav className="pt-navbar pt-dark top-navbar">
          <div className="pt-navbar-group pt-align-left">
            <div className="pt-navbar-heading">Invictus</div>
            <Popover
              content={this.renderMapOptions()}
              position={Position.BOTTOM}
              interactionKind={PopoverInteractionKind.CLICK}
              className="mr-1"
            >
              <Button iconName="map" rightIconName="chevron-down">
                Map Options
              </Button>
            </Popover>
            <Popover
              content={this.renderViewMenu()}
              position={Position.BOTTOM}
              interactionKind={PopoverInteractionKind.CLICK}
            >
              <Button iconName="eye-open" rightIconName="chevron-down">
                <b>View: </b> {VIEWS[this.props.view].name}
              </Button>
            </Popover>
            <div style={{ margin: '0 1rem' }}>
              <Checkbox
                className="pt-large pt-inline"
                checked={this.props.showGrid}
                label="Show Grid"
                onChange={this.props.toggleGrid}
              />
            </div>
          </div>
          <div className="pt-navbar-group pt-align-right">
            <Button
              iconName="help"
              onClick={this.props.toggleKeyboardHelp}
              className="mr-1"
            />
            <div className="pt-button-group">
              <Button
                iconName="floppy-disk"
                onClick={this.props.save}
              >
                Save Map
              </Button>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

interface InfoUIProps {
  cursor?: Phaser.Point | null;
  regen?: (shouldClear?: boolean) => void,
  currentRegion?: Phaser.Point,
  currentSector?: Phaser.Point,
  selectRegion?: (coordinate: Phaser.Point) => void,
  selectSector?: (coordinate: Phaser.Point) => void,
  moveCursor?: (cursor: Phaser.Point) => void,
}

@connect(
  state => state,
  { selectRegion, selectSector, moveCursor }
)
class InfoUI extends React.Component<InfoUIProps, {}> {
  render() {
    const { cursor, regen, currentRegion, currentSector, moveCursor, selectRegion, selectSector } = this.props;

    return (
      <div className="info-ui">
        <div className="header">
          <ul className="pt-breadcrumbs"> 
            <li><a
              className={"pt-breadcrumb" +
                (!currentRegion && !currentSector && " pt-breadcrumb-current" || "")}
              href="#"
              onClick={() => {
                selectRegion(null);
                selectSector(null);
                moveCursor(null);
                regen(false);
              }}
            >World Map</a></li>
            {currentRegion &&
              <li><a
                className={"pt-breadcrumb" +
                  (!currentSector && " pt-breadcrumb-current" || "")}
                href="#"
                onClick={() => {
                  selectRegion(currentRegion);
                  selectSector(null);
                  moveCursor(null);
                  regen(false);
                }}
              >Region: ({currentRegion.x}, {currentRegion.y})</a></li>
            }
            {currentSector &&
              <li><a
                className="pt-breadcrumb pt-breadcrumb-current"
                href="#"
                onClick={() => {
                  selectRegion(currentRegion);
                  selectSector(currentSector);
                  moveCursor(null);
                  regen(false);
                }}
              >Sector: ({currentSector.x}, {currentSector.y})</a></li>
            }
          </ul>
        </div>
        {cursor &&
          <div className="cursor-ui">
            <div className="header">Cursor <b>({cursor.x}, {cursor.y})</b></div>
            <div className="content">
              <Button
                onClick={() => {
                  if (!currentRegion) {
                    // at world, select region
                    console.log('select region');
                    selectRegion(cursor);
                  } else if (!currentSector) {
                    // at region, select sector
                    console.log('Select sector');
                    selectSector(cursor);
                  } else if (currentSector) {
                    // at sector sector
                    // TODO: implement selecting local
                    console.log('Select local');
                  }
                  moveCursor(null);
                  regen(false);
                }}
                iconName="zoom-in"
                text="Zoom In"
              />
              <Button
                onClick={() => {
                  if (currentSector) {
                    // zoom out to region map
                    selectSector(null);
                    moveCursor(null);
                    regen();
                  } else if (currentRegion) {
                    // zoom out to world map
                    selectRegion(null);
                    selectSector(null);
                    moveCursor(null);
                    regen(false);
                  }
                }}
                iconName="zoom-out"
                text="Zoom Out"
              />
            </div>
          </div>
      }
      </div>
    )
  }
}

@connect(state => ({
  isLoading: state.isLoading
}))
class LoadingUI extends React.Component<{ isLoading?: boolean }, null> {
  render() {
    if (!this.props.isLoading) {
      return null;
    }
    return (
      <div className="loading-ui">
        <div className="mb-1">Generating Map</div>
        <Spinner />
      </div>
    );
  }
}

@connect(state => ({
  showKeyboardHelp: state.showKeyboardHelp
}))
class KeyboardHelpUI extends React.Component<{ showKeyboardHelp?: boolean }, null> {
  render() {
    if (!this.props.showKeyboardHelp) {
      return null;
    }
    return (
      <div className="help-ui">
        <div className="modal-header">
          <h1>Keyboard Shortcuts</h1>
        </div>
        <table>
          <tr>
            <td><code>m</code></td>
            <td>Go to game</td>
          </tr>
          <tr>
            <td><code>r</code></td>
            <td>Refresh</td>
          </tr>
          <tr>
            <td><code>v</code></td>
            <td>Cycle views</td>
          </tr>
          <tr>
            <td><code>Esc</code></td>
            <td>Clear cursor selection</td>
          </tr>
          <tr>
            <td><code>?</code></td>
            <td>Toggle this help</td>
          </tr>
        </table>
      </div>
    );
  }
}

export interface UIState {
  view: number,
  showGrid: boolean,
  size: number,
  seed: number,
  currentRegion: Phaser.Point | null,
  currentSector: Phaser.Point | null,
  cursor: Phaser.Point | null,
  isLoading: boolean,
  showKeyboardHelp: boolean,
};

const initialState: UIState = {
  view: 4,
  showGrid: false,
  size: 500,
  seed: Math.random(),
  currentRegion: null,
  currentSector: null,
  cursor: null,
  isLoading: false,
  showKeyboardHelp: false,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_VIEW:
      return {
        ...state,
        view: action.payload,
      };
    case TOGGLE_GRID:
      return {
        ...state,
        showGrid: !state.showGrid,
      };
    case SET_MAP_SIZE:
      return {
        ...state,
        size: action.payload,
      };
    case SET_MAP_SEED:
      return {
        ...state,
        seed: action.payload,
      };
    case SELECT_REGION:
      return {
        ...state,
        currentRegion: action.payload,
      };
    case SELECT_SECTOR:
      return {
        ...state,
        currentSector: action.payload,
      };
    case MOVE_CURSOR:
      return {
        ...state,
        cursor: action.payload,
      };
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case TOGGLE_KEYBOARD_HELP:
      return {
        ...state,
        showKeyboardHelp: !state.showKeyboardHelp,
      };
    default:
      return state;
  }
}
const logger = createLogger({
  collapsed: true,
});
export const store = createStore(reducer, applyMiddleware(logger));

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <div>
          <TopUI {...this.props} />
          <InfoUI {...this.props} />
          <LoadingUI />
          <KeyboardHelpUI />
        </div>
      </Provider>
    )
  }
}
export default function render(controls: any) {
  ReactDOM.render(
    (<App {...controls} /> as any),
    document.getElementById('topUI')
  );
}
