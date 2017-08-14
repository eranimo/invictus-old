# Flow algorithm
Minecraft inspired

1. Place river source cells randomly on land cells

3D block types:
- empty (E)
- land (.)
- ocean (~)
- river (-)
- river source (=)

2. Each tick:
  - place new river block above all source cells
    at highest empty z-level
    e.g. S-E -> S--
  - move all river blocks to lowest downhill neighbor if they have one
    if lowest downhill neighbor has equal height, pick any
  - erase river blocks if they go into ocean cells or off the edge of the map

3. Run enough ticks to generate rivers