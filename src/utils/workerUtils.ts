import isPromise from 'is-promise';

export async function runWorker(worker: any, data: any) {
  const context = new worker();
  return new Promise((resolve, reject) => {
    context.postMessage(data);
    context.addEventListener('message', result => {
      resolve(result.data);
    });
  });
}

let messageID: number = 0;
export class PromiseWorker {
  _worker: any;
  callbacks: { [messageID: number]: Function }
  constructor(worker) {
    this._worker = worker;
    this.callbacks = {};
    this._worker.addEventListener('message', event => {
      this._onMessage(event);
    });
  }
  _onMessage(event) {
    if (!event.data) {
      return;
    }
    const [ id, error, result ] = event.data;

    const callback = this.callbacks[id];

    if (!callback) {
      return;
    }

    delete this.callbacks[id];
    callback(error, result);
  }

  postMessage(data: any, transferrables?: any[]) {
    messageID++;

    return new Promise((resolve, reject) => {
      this.callbacks[messageID] = (error, result) => {
        if (error) {
          return reject(new Error(error.message));
        }
        resolve(result);
      }
      this._worker.postMessage([messageID, data], transferrables);
    });
  }
}

export function registerPromiseWorker(callback: (message: any) => Promise<any>) {
  function postOutgoingMessage(event, id: number, error?, result?) {
    if (error) {
      (self as any).postMessage([id, { message: error.message }]);
    } else {
      (self as any).postMessage([id, null, result])
    }

  }
  function handleIncomingMessage(event, id: number, payload) {
    let result;
    try {
      result = {
        res: callback(payload),
      };
    } catch (err) {
      result = { err };
    }

    if (result.err) {
      postOutgoingMessage(event, id, result.err);
    } else if (!isPromise(result.res)) {
      postOutgoingMessage(event, id, null, result.res);
    } else {
      result.res.then(
        finalResult => postOutgoingMessage(event, id, null, finalResult),
        finalError => postOutgoingMessage(event, id, finalError)
      )
    }
  }
  function onIncomingMessage(event: any) {
    if (!event.data) {
      return;
    }
    console.log(event.data);
    const [id, payload] = event.data;
    handleIncomingMessage(event, id, payload);
  }
  self.addEventListener('message', onIncomingMessage);
}