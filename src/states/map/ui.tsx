import React from 'react';
import ReactDOM from 'react-dom';
import { Popover, Button, Menu, Position } from '@blueprintjs/core';


export default function render() {
  ReactDOM.render(
    <Popover content={<Menu>...</Menu>} position={Position.RIGHT_TOP}>
        <Button iconName="share" text="Open in..." />
    </Popover>
  , document.getElementById('topUI'));
}