import React from 'react';
import ReactDOM from 'react-dom';
import { loadMap, fetchSavedMaps } from 'states/map/ui/redux';
import { connect } from 'react-redux';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import classnames from 'classnames';


interface LoadModalProps {
  isOpen: boolean,
  onClose: () => void,
  loadMap?: (name: string) => void,
  loadingMaps?: boolean,
  savedMaps?: string[],
  fetchSavedMaps?: () => void,
}
interface LoadModalState {
  selected?: number,
}

@connect(state => ({
  loadingMaps: state.loadingMaps,
  savedMaps: state.savedMaps,
}), { loadMap, fetchSavedMaps })
class LoadModal extends React.Component<LoadModalProps, LoadModalState> {
  state = {
    selected: null,
  }

  componentDidMount() {
    this.props.fetchSavedMaps();
  }

  renderModalBody() {
    if (this.props.loadingMaps) {
      return <div>Loading maps...</div>;
    }
    if (this.props.savedMaps.length === 0) {
      return <div>No saved maps</div>;
    }
    return (
      <div>
        <div className="pt-tree pt-elevation-0">
          <ul className="pt-tree-node-list pt-tree-root">
            {this.props.savedMaps.map((name, index) => (
              <li
                key={index}
                className={classnames(
                  'pt-tree-node',
                  this.state.selected === index && 'pt-tree-node-selected',
                )}
                onClick={() => {
                  this.setState({ selected: index })
                }}
              >
                <div className="pt-tree-node-content">
                  <span className="pt-tree-node-caret-none pt-icon-standard"></span>
                  <span className="pt-tree-node-icon pt-icon-standard pt-icon-document"></span>
                <span className="pt-tree-node-label">
                  {name}
                </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <br />
        {this.state.selected !== null
          ? <div className="pt-dialog-footer">
              <div className="pt-dialog-footer-actions">
                <Button
                  intent={Intent.PRIMARY}
                  onClick={() => {
                    const mapName = this.props.savedMaps[this.state.selected];
                    this.props.loadMap(mapName);
                    this.props.onClose();
                  }}
                >
                  Load
                </Button>
              </div>
            </div>
          : 'Select a map to load'}
      </div>
    );
  }

  render() {
    return (
      <Dialog
        className="pt-dark"
        iconName="download"
        isOpen={this.props.isOpen}
        onClose={this.props.onClose}
        title="Load Map"
      >
        <div className="pt-dialog-body">
          {this.renderModalBody()}
        </div>
      </Dialog>
    )
  }
}

export default LoadModal;