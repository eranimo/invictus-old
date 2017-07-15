import ndarray from 'ndarray';
import zoomableNoise from '../utils/zoomableNoise';


self.addEventListener('message', event => {
  const { size, sealevel } = event.data;
  console.log('Making local map');
  const data: any = {};

  data.terrain = ndarray(new Uint8ClampedArray(size * size), [size, size]);;

  (self as any).postMessage(data);
});