import React from 'react';
import ReactDOM from 'react-dom';
import {
  Popover,
  Button,
  Menu,
  MenuItem,
  Position,
  Checkbox,
  PopoverInteractionKind
} from '@blueprintjs/core';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { VIEWS } from './views';


export const SET_VIEW = 'SET_VIEW';
export const setView = (view) => ({ type: SET_VIEW, payload: view });

export const TOGGLE_GRID = 'TOGGLE_GRID';
export const toggleGrid = () => ({ type: TOGGLE_GRID });

interface TopUIProps {
  view?: number
  showGrid?: boolean,
  setView?: (view: number) => any,
  toggleGrid?: () => any,
}

@connect(state => ({
  view: state.view,
  showGrid: state.showGrid,
}), { setView, toggleGrid })
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

  render() {
    return (
      <div className="top-ui">
        <nav className="pt-navbar pt-dark">
          <div className="pt-navbar-group pt-align-left">
            <div className="pt-navbar-heading">Invictus</div>
            <Popover
              content={this.renderViewMenu()}
              position={Position.BOTTOM}
              interactionKind={PopoverInteractionKind.CLICK}
            >
              <Button iconName="eye-open">
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
        </nav>
      </div>
    );
  }
}

export interface UIState {
  view: number,
  showGrid: boolean,
}

const initialState: UIState = {
  view: 0,
  showGrid: false,
}

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
        <TopUI />
      </Provider>
    )
  }
}
export default function render() {
  ReactDOM.render(
    (<App /> as any),
    document.getElementById('topUI')
  );
}