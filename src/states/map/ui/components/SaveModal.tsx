import React from 'react';
import ReactDOM from 'react-dom';
import { saveMap } from 'states/map/ui/redux';
import { connect } from 'react-redux';
import { Dialog, Button, Text } from '@blueprintjs/core';

interface LoadModalProps {
  isOpen: boolean,
  onClose: () => void
  saveMap?: (name: string) => void,
}

@connect(null, { saveMap })
class SaveModal extends React.Component<LoadModalProps, { name: string }> {
  _nameField: HTMLInputElement;

  state = {
    name: '',
  };

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
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    )
  }
}

export default SaveModal;