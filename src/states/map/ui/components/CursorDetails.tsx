import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import {
  selectRegion, moveCursor, regen
} from 'states/map/ui/redux';
import { Button } from '@blueprintjs/core';


interface InfoUIProps {
  cursor?: Phaser.Point | null;
  regen?: (shouldClear?: boolean) => void,
  currentRegion?: Phaser.Point,
  currentSector?: Phaser.Point,
  selectRegion?: (coordinate: Phaser.Point) => void,
  moveCursor?: (cursor: Phaser.Point) => void,
}

@connect(
  state => state,
  { selectRegion, moveCursor, regen }
)
class CursorDetails extends React.Component<InfoUIProps, {}> {
  render() {
    const { cursor, regen, currentRegion, currentSector, moveCursor, selectRegion } = this.props;

    return (
      <div className="info-ui">
        <div className="header">
          <ul className="pt-breadcrumbs"> 
            <li>
              <a
                className={"pt-breadcrumb" + (!currentRegion && !currentSector && " pt-breadcrumb-current" || "")}
                href="#"
                onClick={() => {
                  selectRegion(null);
                  moveCursor(null);
                  regen(false);
                }}
              >
                World Map
              </a>
            </li>
            {currentRegion && (
              <li>
                <a
                  className={"pt-breadcrumb" + (!currentSector && " pt-breadcrumb-current" || "")}
                  href="#"
                  onClick={() => {
                    selectRegion(currentRegion);
                    moveCursor(null);
                    regen(false);
                  }}
                >
                  Region: ({currentRegion.x}, {currentRegion.y})
                </a>
              </li>
            )}
          </ul>
        </div>
        {cursor &&
          <div className="cursor-ui">
            <div className="header">Cursor <b>({cursor.x}, {cursor.y})</b></div>
            <div className="content">
              {!currentRegion && <Button
                onClick={() => {
                  // at world, select region
                  console.log('select region');
                  selectRegion(cursor);
                  moveCursor(null);
                  regen(false);
                }}
                iconName="zoom-in"
                text="Zoom In"
              />}
            </div>
          </div>
      }
      </div>
    )
  }
}

export default CursorDetails;