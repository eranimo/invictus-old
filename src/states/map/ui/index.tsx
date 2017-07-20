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
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { Provider, connect } from 'react-redux';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import { VIEWS } from '../views';
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

  reducer
} from './redux';
import Navbar from './components/Navbar';
import CursorDetails from './components/CursorDetails';
import Loading from './components/Loading';
import KeyboardHelp from './components/KeyboardHelp';


const logger = createLogger({
  collapsed: true,
});
const sagaMiddleware = createSagaMiddleware();
export const store = createStore(
  reducer,
  applyMiddleware(logger, sagaMiddleware)
);

export const runSaga = callback => sagaMiddleware.run(callback);

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <div>
          <Navbar {...this.props} />
          <CursorDetails {...this.props} />
          <Loading />
          <KeyboardHelp />
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