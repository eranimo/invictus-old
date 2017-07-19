import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import {
  selectRegion, selectSector, moveCursor
} from 'states/map/ui/redux';
import { Button } from '@blueprintjs/core';


interface InfoUIProps {
  cursor?: Phaser.Point | null;
  regen?: (shouldClear?: boolean) => void,
  currentRegion?: Phaser.Point,
  currentSector?: Phaser.Point,
  selectRegion?: (coordinate: Phaser.Point) => void,
  selectSector?: (coordinate: Phaser.Point) => void,
  moveCursor?: (cursor: Phaser.Point) => void,
}

@connect(
  state => state,
  { selectRegion, selectSector, moveCursor }
)
class CursorDetails extends React.Component<InfoUIProps, {}> {
  render() {
    const { cursor, regen, currentRegion, currentSector, moveCursor, selectRegion, selectSector } = this.props;

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
                  selectSector(null);
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
                    selectSector(null);
                    moveCursor(null);
                    regen(false);
                  }}
                >
                  Region: ({currentRegion.x}, {currentRegion.y})
                </a>
              </li>
            )}
            {currentSector && (
              <li>
                <a
                  className="pt-breadcrumb pt-breadcrumb-current"
                  href="#"
                  onClick={() => {
                    selectRegion(currentRegion);
                    selectSector(currentSector);
                    moveCursor(null);
                    regen(false);
                  }}
                >
                  Sector: ({currentSector.x}, {currentSector.y})
                </a>
              </li>
            )}
          </ul>
        </div>
        {cursor &&
          <div className="cursor-ui">
            <div className="header">Cursor <b>({cursor.x}, {cursor.y})</b></div>
            <div className="content">
              <Button
                onClick={() => {
                  if (!currentRegion) {
                    // at world, select region
                    console.log('select region');
                    selectRegion(cursor);
                  } else if (!currentSector) {
                    // at region, select sector
                    console.log('Select sector');
                    selectSector(cursor);
                  } else if (currentSector) {
                    // at sector sector
                    // TODO: implement selecting local
                    console.log('Select local');
                  }
                  moveCursor(null);
                  regen(false);
                }}
                iconName="zoom-in"
                text="Zoom In"
              />
            </div>
          </div>
      }
      </div>
    )
  }
}

export default CursorDetails;