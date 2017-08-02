export interface MapSize {
  name: string,
  size: number,
  mapSpriteSize: number,
  mapScale: number,
};

export const SIZES: Array<MapSize> = [
  {
    name: 'Small',
    size: 100,
    mapSpriteSize: 100,
    mapScale: 10,
  },
  {
    name: 'Medium',
    size: 300,
    mapSpriteSize: 300,
    mapScale: 4,
  },
  {
    name: 'Large',
    size: 600,
    mapSpriteSize: 600,
    mapScale: 2,
  }
]