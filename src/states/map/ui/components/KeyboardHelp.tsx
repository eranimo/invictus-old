import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Dialog } from '@blueprintjs/core';
import { toggleKeyboardHelp } from '../redux';


interface KeyboardHelpProps {
  showKeyboardHelp?: boolean,
  toggleKeyboardHelp?: () => any
}

@connect(state => ({
  showKeyboardHelp: state.showKeyboardHelp
}), { toggleKeyboardHelp })
class KeyboardHelp extends React.Component<KeyboardHelpProps, null> {
  render() {
    return (
      <Dialog
        className="pt-dark"
        iconName="help"
        isOpen={this.props.showKeyboardHelp}
        onClose={this.props.toggleKeyboardHelp}
        title="Keyboard Help"
      >
        <div className="pt-dialog-body">
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
              <td><code>w</code></td>
              <td>Pan up</td>
            </tr>
            <tr>
              <td><code>a</code></td>
              <td>Pan left</td>
            </tr>
            <tr>
              <td><code>s</code></td>
              <td>Pan down</td>
            </tr>
            <tr>
              <td><code>d</code></td>
              <td>Pan right</td>
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
      </Dialog>
    );
  }
}

export default KeyboardHelp;
