import { inRange } from 'lodash';


export const levels = {
  world: {
    numIterations: 5,
    persistence: 0.6,
    initFrequency: 2,
    zoomLevel: 1,
    transform: (x, y) => [x, y],
  },
  region: {
    numIterations: 25,
    persistence: 0.6,
    initFrequency: 2,
    zoomLevel: 10,
    transform(x, y, position) {
      const nx = (x + position.x) / 10;
      const ny = (y + position.y) / 10;
      return [nx, ny];
    }
  },
  sector: {
    numIterations: 50,
    persistence: 0.6,
    initFrequency: 2,
    zoomLevel: 100,
    transform(x, y, position) {
      const nx = (x + position.x) / 100;
      const ny = (y + position.y) / 100;
      return [nx, ny];
    }
  },
};

export const terrainTypes = [
  {
    title: 'Coral Reef',
  },
  {
    title: 'Poor Soil',
  },
  {
    title: 'Rich Soil'
  },
  {
    title: 'Mud'
  },
  {
    title: 'Swamp'
  }
];

export const features = [
  {
    title: 'Tree',
  },
  {
    title: 'Grass',
  },
  {
    title: 'Stones',
  },
];
