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
  Tooltip
} from '@blueprintjs/core';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
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

interface TopUIProps {
  view?: number

  // view options
  showGrid?: boolean,
  currentRegion: Phaser.Point,
  currentSector: Phaser.Point,

  // map options
  seed?: number,
  size?: number,

  setView?: (view: number) => any,
  toggleGrid?: () => any,
  regen: () => void,
  save: () => void
  setMapSeed: (seed: number) => void,
  setMapSize: (size: number) => void,
}

@connect(state => ({
  ...state,
  showGrid: state.showGrid,
}), { setView, toggleGrid, setMapSeed, setMapSize })
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
                onChange={e => this.props.setMapSize(parseInt(e.target.value))}
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
                onChange={e => this.props.setMapSeed(e.target.value)}
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

export interface UIState {
  view: number,
  showGrid: boolean,
  size: number,
  seed: number,
  currentRegion: Phaser.Point | null,
  currentSector: Phaser.Point | null,
};

const initialState: UIState = {
  view: 0,
  showGrid: false,
  size: 250,
  seed: Math.random(),
  currentRegion: null,
  currentSector: null,
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
    default:
      return state;
  }
}

export const store = createStore(reducer);

store.subscribe(() => {
  console.log(store.getState());
});

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <TopUI {...this.props} />
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