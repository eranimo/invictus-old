import { inRange } from 'lodash';


const CORAL_REEF_TEMP_CUTOFF = 25;

export interface Biome {
  title: String,
  color: Array<number>,
  type: String,
  test: (rad: number, rain: number, height: number, sealevel: number) => boolean,
}

export const BIOMES: Array<Biome> = [
  {
    title: 'Polar Desert',
    color: [224, 224, 224],
    type: 'land',
    test: (rad, rain) => (inRange(rad, -31, -15) && inRange(rain, 0, 7000)) ||
                         (inRange(rad, -15, -10) && inRange(rain, 1000, 7000))
  },
  {
    title: 'Tundra',
    color: [114, 153, 128],
    type: 'land',
    test: (rad, rain, height, sealevel) => {
      return (
        (height - sealevel) < 20 &&
        inRange(rad, -15, -10) && inRange(rain, 0, 1000)
      );
    }
  },
  {
    title: 'Alpine Tundra',
    color: [157, 181, 216],
    type: 'land',
    test: (rad, rain, height, sealevel) => {
      return (
        (height - sealevel) >= 20 &&
        inRange(rad, -15, -10) && inRange(rain, 0, 1000)
      );
    }
  },
  {
    title: 'Arid Desert',
    color: [130, 66, 37],
    type: 'land',
    test: (rad, rain) => inRange(rad, -10, 35) && inRange(rain, 0, 25)
  },
  {
    title: 'Arid Shrubland',
    color: [171, 95, 57],
    type: 'land',
    test: (rad, rain) => inRange(rad, -10, 35) && inRange(rain, 25, 125)
  },
  {
    title: 'Semiarid Desert',
    color: [215, 170, 110],
    type: 'land',
    test: (rad, rain) => (inRange(rad, 5, 20) && inRange(rain, 125, 250)) || 
                         (inRange(rad, 20, 35) && inRange(rain, 125, 500))
  },
  {
    title: 'Dry Steppe',
    color: [147, 123, 56],
    type: 'land',
    test: (rad, rain) => (inRange(rad, 10, 15) && inRange(rain, 250, 500))
  },	
  {
    title: 'Temperate Steppe',
    color: [247, 236, 88],
    type: 'land',
    test: (rad, rain) => (inRange(rad, 0, 10) && inRange(rain, 250, 1000)) ||
                         (inRange(rad, 0, 5) && inRange(rain, 125, 250))
  },
  {
    title: 'Grass Savanna',
    color: [199, 196, 61],
    type: 'land',
    test: (rad, rain) => (inRange(rad, 15, 20) && inRange(rain, 250, 625)) ||
                         (inRange(rad, 20, 35) && inRange(rain, 500, 625))
  },
  {
    title: 'Tree Savanna',
    color: [164, 159, 0],
    type: 'land',
    test: (rad, rain) => (inRange(rad, 20, 35) && inRange(rain, 625, 1000))
  },
  {
    title: 'Woodland',
    color: [125, 95, 135],
    type: 'land',
    test: (rad, rain) => (inRange(rad, 10, 15) && inRange(rain, 500, 1000)) ||
                         (inRange(rad, 15, 20) && inRange(rain, 625, 1000)),
  },
  // {
  //   // TODO: remove
  //   title: 'Grassland',
  //   color: [166, 223, 106],
  //   type: 'land',
  //   test: (rad, rain) => (inRange(rad, -10, 0) && inRange(rain, 75, 1000)) ||
  //                            (inRange(rad, 0, 10) && inRange(rain, 500, 1250)) ||
  //                            (inRange(rad, 10, 35) && inRange(rain, 750, 1500))
  // },
  {
    title: 'Boreal Forest',
    color: [28, 94, 74],
    type: 'land',
    test: (rad, rain) => inRange(rad, -10, 0) && inRange(rain, 125, 7000),
  },
  {
    title: 'Temperate Forest',
    color: [144, 218, 58],
    type: 'land',
    test: (rad, rain) => inRange(rad, 0, 20) && inRange(rain, 1000, 3000)
  },
  {
    title: 'Tropical Forest',
    color: [96, 122, 34],
    type: 'land',
    test: (rad, rain) => inRange(rad, 20, 35) && inRange(rain, 1000, 3000),
  },
  {
    title: 'Temperate Rainforest',
    color: [89, 129, 89],
    type: 'land',
    test: (rad, rain) => inRange(rad, 0, 20) && inRange(rain, 3000, 7000),
  },
  {
    title: 'Tropical Rainforest',
    color: [0, 70, 0],
    type: 'land',
    test: (rad, rain) => inRange(rad, 20, 35) && inRange(rain, 3000, 7000)
  },

  // water biomes
  {
    title: 'Ice Shelf',
    color: [224, 224, 244],
    type: 'water',
    test: (rad, rain, height, sealevel) => {
      return (inRange(height - sealevel, -10, 0) && rad < -20) ||
             (inRange(rad, -30, -20))
    }
  },
  {
    title: 'Coast',
    type: 'water',
    color: [14, 63, 80],
    test: (rad, rain, height, sealevel) => {
      return rad >= -20 && rad < CORAL_REEF_TEMP_CUTOFF && height <= sealevel && height >= sealevel - 10;
    }
  },
  {
    title: 'Ocean',
    type: 'water',
    color: [4, 53, 70],
    test: (rad, rain, height, sealevel) => height < sealevel - 10 &&
      !((inRange(height - sealevel, -10, 0) && rad < -20) ||
      (inRange(rad, -30, -20)))
  },
  {
    title: 'Coral Reef',
    type: 'water',
    color: [24, 83, 90],
    test: (rad, rain, height, sealevel) => {
      return rad > CORAL_REEF_TEMP_CUTOFF && height <= sealevel && height >= sealevel - 10;
    }
  },
];