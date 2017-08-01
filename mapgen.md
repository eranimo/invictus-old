# Map Generator Algorithm
This document outlines a multi-stage algorithm for generating procedural worlds with rivers and biomes.

## Step 0 (world map)
  - generate a world heightmap
  - divide world map into a grid of region cells
  - pick a region with 80% land (so on the cost)

## Step 1 (only height)
  - generate heightmap for this region if one doesn't exist
  - generate heightmaps for all 4-neighboring cells if they don't exist

## Step 2 (only rivers)
  - pick a number of random costal land cells in the region map
    - River step: follow uphill until there are no higher neighbors or the edge of the region was reached
  - for all neighboring regions in step 2
    - for all river cells on the border with this region
      - perform river step

## Step 3 (moisture)
  - for all river cells, paint all cells within x cells (TBD) with w amount of moisture (TBD)

## Step 4 (temperature + biomes)
  - determine temperature of cells based on:
    2. latitude
    1. altitude
  - determine biomes of cells based on moisture and temperature

