export const WORLD_INIT = 'WORLD_INIT';
export const worldInit = (options) => ({ type: WORLD_INIT, payload: options });

export const GENERATE_CHUNK = 'GENERATE_CHUNK';
export const generateChunk = (chunk: Phaser.Point) => ({ type: GENERATE_CHUNK, payload: chunk });