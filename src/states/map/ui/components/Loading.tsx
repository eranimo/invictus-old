import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';


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
        <div className="mb-1">Loading Map</div>
        <Spinner />
      </div>
    );
  }
}

export default LoadingUI;