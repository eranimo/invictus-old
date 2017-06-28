import ndarray from 'ndarray';
import fill from 'ndarray-fill';
import SimplexNoise from 'simplex-noise';
import Alea from 'alea';


// https://cmaher.github.io/posts/working-with-simplex-noise/
const zoomableNoise = noise => ({ numIterations, persistence, initFrequency }) => (nx, ny) => {
  // persistence is the scale factor in each iteration
  let maxAmp = 0;
  let amp = 1; // relative importance of the octave in the sum of the octaves
  let freq = initFrequency;
  let noiseValue = 0;
  const low = 0;
  const high = 255;

  // add successively smaller, higher-frequency terms
  for (let i = 0; i < numIterations; ++i) {
    noiseValue += noise(nx * freq, ny * freq) * amp;
    maxAmp += amp;
    amp *= persistence;
    freq *= 2;
  }

  // take the average value of the iterations
  noiseValue /= maxAmp;

  // normalize the result
  noiseValue = noiseValue * (high - low) / 2 + (high + low) / 2;

  return noiseValue;
};

const levels = {
  world: {
    numIterations: 5,
    persistence: 0.55,
    initFrequency: 2,
    zoomScale: 1,
  },
  region: {
    numIterations: 25,
    persistence: 0.6,
    initFrequency: 2,
    zoomScale: 10,
  },
};

function makeHeightmap({ seed, size, level, offset = { x: 0, y: 0 } }) {
  const heightmap = ndarray(new Uint8ClampedArray(size * size), [size, size]);

  const rng = new Alea(seed);
  const simplex = new SimplexNoise(rng);
  const noise = (nx, ny) => simplex.noise2D(nx, ny) / 2 + 0.5;
  const options = levels[level];

  fill(heightmap, (x, y) => {
    const nx = ((x + offset.x) / options.zoomScale) / size - 0.5;
    const ny = ((y + offset.y) / options.zoomScale) / size - 0.5;
    return zoomableNoise(noise)(options)(nx, ny);
  });
  return heightmap.data;
}

self.addEventListener('message', event => {
  const { heightmap } = event.data;
  const data = {};
  console.log(`Made a new ${heightmap.level} heightmap`);
  data.heightmap = makeHeightmap(heightmap);
  self.postMessage(data);
});
