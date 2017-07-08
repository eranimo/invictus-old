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
  local: {
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


export const biomes = [
  {
    id: 0,
    title: 'No biome',
    color: [0, 0, 0],
    test: () => false,
  },
  {
    id: 1,
    title: 'Ice',
    color: [224, 224, 224],
    test: (rad, rain) => (inRange(rad, -30, -20) && inRange(rain, 0, 7000)) ||
                         (inRange(rad, -20, -10) && inRange(rain, 750, 7000))
  },
  {
    id: 2,
    title: 'Tundra',
    color: [114, 153, 128],
    test: (rad, rain) => inRange(rad, -20, -10) && inRange(rain, 0, 750)
  },
  {
    id: 3,
    title: 'Desert',
    color: [237, 217, 135],
    test: (rad, rain) => (inRange(rad, -10, 0) && inRange(rain, 0, 250)) ||
                         (inRange(rad, 0, 10) && inRange(rain, 0, 500)) ||
                         (inRange(rad, 10, 30) && inRange(rain, 0, 750))
  },
  {
    id: 4,
    title: 'Grassland',
    color: [166, 223, 106],
    test: (rad, rain) => (inRange(rad, -10, 0) && inRange(rain, 250, 1000)) ||
                         (inRange(rad, 0, 10) && inRange(rain, 500, 1250)) ||
                         (inRange(rad, 10, 30) && inRange(rain, 750, 1500))
  },
  {
    id: 5,
    title: 'Boreal Forest',
    color: [28, 94, 74],
    test: (rad, rain) => inRange(rad, -10, 0) && inRange(rain, 1000, 7000),
  },
  {
    id: 6,
    title: 'Temperate Forest',
    color: [76, 192, 0],
    test: (rad, rain) => (inRange(rad, 0, 10) && inRange(rain, 1250, 3000)) ||
                         (inRange(rad, 10, 20) && inRange(rain, 1500, 3000))
  },
  {
    id: 7,
    title: 'Tropical Forest',
    color: [96, 122, 34],
    test: (rad, rain) => inRange(rad, 20, 30) && inRange(rain, 1500, 3000),
  },
  {
    id: 8,
    title: 'Temperate Rainforest',
    color: [89, 129, 89],
    test: (rad, rain) => inRange(rad, 0, 20) && inRange(rain, 3000, 7000),
  },
  {
    id: 9,
    title: 'Tropical Rainforest',
    color: [0, 70, 0],
    test: (rad, rain) => inRange(rad, 20, 30) && inRange(rain, 3000, 7000)
  }
];
