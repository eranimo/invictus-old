import * as Worker from 'worker-loader!./worker';
import { MapSettings } from 'states/map/mapManager';
import { PromiseWorker } from 'utils/workerUtils';
import * as ACTIONS from './workerActions';


export default class MapGenerator {
  settings: MapSettings;
  _worker: any;
  worker: PromiseWorker;

  constructor(settings: MapSettings) {
    this.settings = settings;
    this._worker = new Worker(this.settings);
    this.worker = new PromiseWorker(this._worker);
  }

  async generate() {
    return await this.worker.postMessage(
      ACTIONS.worldInit(this.settings)
    );
  }

  async generateChunk(chunk: Phaser.Point) {
    return await this.worker.postMessage(
      ACTIONS.generateChunk(chunk)
    );
  }
}