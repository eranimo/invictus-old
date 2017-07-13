// https://cmaher.github.io/posts/working-with-simplex-noise/
const zoomableNoise = noise => ({
  numIterations, persistence, maxAmp = 0, initFrequency
}) => (nx, ny) => {
  // persistence is the scale factor in each iteration
  let amp = 1; // relative importance of the octave in the sum of the octaves
  let freq = initFrequency;
  let noiseValue = 0;

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
  //noiseValue = noiseValue * (high - low) / 2 + (high + low) / 2;

  return (noiseValue + 1) / 2;
};

export default zoomableNoise;
