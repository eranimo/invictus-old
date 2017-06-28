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
    persistence: 0.6,
    initFrequency: 2,
    transform: (x, y) => [x, y],
  },
  region: {
    numIterations: 25,
    persistence: 0.6,
    initFrequency: 2,
    transform(x, y, position) {
      const nx = (x + position.region.x) / 10;
      const ny = (y + position.region.y) / 10;
      return [nx, ny];
    }
  },
  local: {
    numIterations: 35,
    persistence: 0.6,
    initFrequency: 2,
    transform(x, y, position) {
      const nx = (x + position.local.x) / 100;
      const ny = (y + position.local.y) / 100;
      return [nx, ny];
    }
  },
};

function makeHeightmap({ seed, size, level, position }) {
  const heightmap = ndarray(new Uint8ClampedArray(size * size), [size, size]);

  const rng = new Alea(seed);
  const simplex = new SimplexNoise(rng);
  const noise = (nx, ny) => simplex.noise2D(nx, ny) / 2 + 0.5;
  const options = levels[level];

  fill(heightmap, (x, y) => {
    const [nx, ny] = options.transform(x, y, position);
    return zoomableNoise(noise)(options)(nx / size + 0.5, ny / size + 0.5);
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
