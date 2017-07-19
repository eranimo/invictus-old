import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';


@connect(state => ({
  showKeyboardHelp: state.showKeyboardHelp
}))
class KeyboardHelp extends React.Component<{ showKeyboardHelp?: boolean }, null> {
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

export default KeyboardHelp;