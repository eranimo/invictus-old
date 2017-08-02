import ndarray from 'ndarray';


function makeRivermap({
  heightmap,
  neighbors,
  size
}: {
  heightmap: ndarray,
  neighbors: ndarray,
  size: number,
}) {
  const rivermap = ndarray(new Uint8ClampedArray(size * size), [size, size]);

  return rivermap;
}

self.addEventListener('message', event => {
  console.log('Making terrain map');
  let array: ndarray = makeRivermap(event.data);

  (self as any).postMessage(array.data);
});