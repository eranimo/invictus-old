import colormap from 'colormap';
import { groupBy } from 'lodash';
import { BIOMES } from 'mapgen/biomes';


const contour = (value, c = 10) => Math.ceil(value / c) * c;
const coastline = (value, sealevel) => value < sealevel ? 0 : 255;
const temperatureMap = colormap({ nshades: 65, format: 'rgb' });
const rainfallMap = colormap({ nshades: 7000, format: 'rgb', colormap: 'YIGnBu' });

interface ViewParams {
  height: number,
  rainfall: number,
  radiation: number,
  biome: number,
  sealevel: number,
}

export interface View {
  name: string,
  fn(params: ViewParams): Array<number>
}

const WATER = [4, 53, 70, 1];
export const VIEWS: Array<View> = [
  {
    name: 'Heightmap',
    fn: ({ height }) => {
      const v = contour(height, 10);
      return [v, v, v, 1];
    }
  },
  {
    name: 'Sea Level',
    fn: ({ sealevel, height }) => {
      const v = coastline(height, sealevel);
      return [v, v, v, 1];
    }
  },
  {
    name: 'Radiation',
    fn: ({ height, radiation, sealevel }) => {
      if (height < sealevel + 2 && height > sealevel - 2) {
        return [0, 0, 0];
      }
      return temperatureMap[Math.round(radiation + 30)] || [0, 0, 0, 0];
    }
  },
  {
    name: 'Rainfall',
    fn: ({ height, rainfall, sealevel }) => {
      if (height < sealevel) {
        return WATER;
      }
      return rainfallMap[Math.round(rainfall)] || [0, 0, 0, 0];
    }
  },
  {
    name: 'Biome',
    fn: ({ biome }) => {
      // if (height < SEALEVEL) {
      //   return WATER;
      // }
      if (biome in BIOMES) {
        return BIOMES[biome].color;
      }
      throw new Error(`Cannot find biome with id ${biome}`);
    }
  }
];