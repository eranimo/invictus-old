import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Button } from '@blueprintjs/core';


class Compass extends React.Component {
  render() {
    return (
      <div className="pt-button-group pt-vertical pt-minimal compass-ui">
        <Button iconName="arrow-up" />
        <div className="pt-button-group pt-minimal">
          <Button iconName="arrow-left" />
          <Button iconName="dot" disabled={ true } />
          <Button iconName="arrow-right" />
        </div>
        <Button iconName="arrow-down" />
      </div>
    );
  }
}

export default Compass;
