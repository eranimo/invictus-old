# Map Generator Algorithm
This document outlines a multi-stage algorithm for generating procedural worlds with rivers and biomes.

## Outline

### Step 1: Prep
This step generates a world heightmap at a higher zoom level to determine where to generate rivers

- Generate a "world map" heightmap used only to find continents and generate river sources
- Split cells in to land and water cells
- Decide a sealevel value

- Create a new blank 2D array to contain local heightmap (referred to as the "regional map")
  - Each cell has:
    - x and y
    - height
    - altitude (height - sealevel)
    - latitude (distance from equator)
    - biome
    - moisture
    - temperature
    - a distance to coast number
    - a land or ocean enum
    - references to all 8 neighbors

### Step 2: Rivers
Generate rivers by transfering water from source cells downhill.

- decide a number of river source cells at the coast (coast as defined by world map)
  - generate height at all source cells in the regional map
      drop if regional height is below sea level
- river data structure is a tree of cell nodes
- **river** algorithm:
  - generate height at all neighbors
  - maintain distance from coast of all cells
  - if we have neighbors above sea level & above the last cell:
    - mark *i* of the highest neighboring cells as a river (high to low)
      where *i* is a percentage chance that increases as the distance from the coast increases
      (this creates river tributaries)
    - continue flow algorithm at next cells
  - else:
    - end the river

### Step 3: Moisture
- **moisture** algorithm:
  - for all cells in river:
    - increase moisture value of all cells within x radius
      - where x is a distance relative to the distance to coast number
        such that closer to the coast yields higher values
        and farther yields lower values

### Step 4: Chunk-based biosphere
- Given a camera, decide a number of subsections of the regional map called chunks.
  - each cunk is a 10x10 2D array
  - Decide which chunks are visible
  - complete chunk:
    - For each cell in the chunk:
      - Calculate the height of all cells that don't have one
      - Determine **temperature** based on altitude and abs(latitude)
      - Calculate **biome** based on moisture and temperature
