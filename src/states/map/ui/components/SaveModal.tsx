import React from 'react';
import ReactDOM from 'react-dom';
import { saveMap } from 'states/map/ui/redux';
import { connect } from 'react-redux';
import { Dialog, Button, Text } from '@blueprintjs/core';

interface LoadModalProps {
  isOpen: boolean,
  onClose: () => void
  saveMap?: (name: string) => void,
  loadedMapName?: string,
}

@connect(state => ({
  loadedMapName: state.loadedMapName
}), { saveMap })
class SaveModal extends React.Component<LoadModalProps, { name: string }> {
  _nameField: HTMLInputElement;

  state = {
    name: '',
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.loadedMapName !== this.props.loadedMapName) {
      this.setState({ name: nextProps.loadedMapName });
    }
  }

  render() {
    return (
      <Dialog
        className="pt-dark"
        iconName="floppy-disk"
        isOpen={this.props.isOpen}
        onClose={this.props.onClose}
        title="Save Map"
      >
        <div className="pt-dialog-body">
          <div className="pt-form-group">
            <label
              className="pt-label"
              htmlFor="example-form-group-input-a"
            >
              Map Name
            </label>
            <div className="pt-form-content">
              <input
                id="example-form-group-input-a"
                className="pt-input pt-intent-primary pt-fill"
                placeholder="Enter a map name"
                type="text"
                value={this.state.name}
                autoFocus
                onChange={evt => this.setState({ name: evt.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            <Button
              onClick={() => {
                this.props.saveMap(this.state.name);
                this.props.onClose();
              }}
              disabled={this.state.name.length === 0}
            >
              {this.props.loadedMapName === this.state.name
                ? 'Overwrite'
                : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }
}

export default SaveModal;