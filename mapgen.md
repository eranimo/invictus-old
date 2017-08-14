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

- decide a number of river source cells on land (land defined by world map)
  - generate height at all source cells in the regional map
- river data structure is a tree of cell nodes
- cell nodes can be either river or lake
- **river** algorithm:
  - generate height at all neighbors
  - if we have neighbors above sea level:
    - if we have neighbors below the last cell:
      - mark *i* of the lowest neighboring cells as a river (high to low)
        where *i* is a percentage chance that increases as the distance from the coast increases
        (this creates river tributaries)
      - continue river algorithm at next cell(s)
    - form a lake:
      (1) current water level = height of last river node
          last iteration cells = new Set()
      (2) do a flood-fill at current location for all cells below current water level
          mark these as lakes
      (3) if any cell in this iteration has a lower height than the last, this cell is a spill
          end the algorithm if one is found
      (4) raise water level and repeat (1)
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
      - Calculate terrain types at each z-level:
        - mineral deposits formed by 3D cellular automata
          randomly placed source blocks, randomly growing outwards
          higher chance of spreading horizontall than vertically
          fixed amount of generations per chunk
        - layered simplex noise to determine rock layers