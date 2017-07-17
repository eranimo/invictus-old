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
    size: 250,
    mapSpriteSize: 250,
    mapScale: 4,
  },
  {
    name: 'Large',
    size: 500,
    mapSpriteSize: 500,
    mapScale: 2,
  }
]