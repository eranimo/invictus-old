import React from 'react';
import ReactDOM from 'react-dom';
import { VIEWS } from 'states/map/views';
import { connect } from 'react-redux';
import {
  setView,
  toggleGrid,
  setMapSeed,
  setMapSize,
  toggleKeyboardHelp,
} from 'states/map/ui/redux';
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
} from '@blueprintjs/core';


interface TopUIProps {
  view?: number

  // view options
  showGrid?: boolean,
  currentRegion?: Phaser.Point,
  currentSector?: Phaser.Point,
  cursor?: Phaser.Point,

  // map options
  mapSettings?: {
    seed: number,
    size: number,
  },

  setView?: (view: number) => any,
  toggleGrid?: () => any,
  regen?: () => void,
  save?: () => void
  setMapSeed?: (seed: number) => void,
  setMapSize?: (size: number) => void,
  toggleKeyboardHelp?: () => any,
}

@connect(state => state, {
  setView, toggleGrid, setMapSeed, setMapSize, toggleKeyboardHelp,
})
class Navbar extends React.Component<TopUIProps, any> {

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
                value={this.props.mapSettings.size}
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
                value={this.props.mapSettings.seed.toString()}
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

export default Navbar;