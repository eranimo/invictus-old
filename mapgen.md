# Map Generator Algorithm
This document outlines a multi-stage algorithm for generating procedural worlds with rivers and biomes.

## Outline

### Step 0 (world map heights)
This step generates a world heightmap at a higher zoom level to determine where to generate the first region

  - generate a world heightmap
  - divide world map into a grid of region cells
  - pick a region with 80% land (so on the cost)

### Step 1 (only height)
Treating regions like wang tiles to make sure further steps have heightmaps in all directions

  - generate heightmap for this region if one doesn't exist
  - generate heightmaps for all 8-neighboring cells if they don't exist

### Step 2 (only rivers)
Generates rivers by going uphill from costal cells

river algorithm:
- pick a number of random costal land cells in the region map
- follow uphill until there are no higher neighbors or the edge of the region was reached

run river algorithm on current region, extending rivers into 8-neighbors
run river algorithm on each 8-neighbor, extending into current region

### Step 3 (moisture)
Propagates moisture from rivers and costal cells

  - for all river cells, paint all cells (in all regions) within x cells (TBD) with w amount of moisture (TBD)
    with more moisture nearer to the river cells
  - for all costal cells, paint a small amount of moisture in the area in the same way

### Step 4 (temperature + biomes)
  - determine temperature of cells based on:
    2. latitude
    1. altitude
  - determine biomes of cells based on moisture and temperature

### Step 5 (world map final)

## Workers

heightGen.ts - heightmap generator for world and regions
riverGen.ts - generates rivers
terraGen.ts - moisture, temperature, biomes
