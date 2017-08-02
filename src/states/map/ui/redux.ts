import { MapSettings, blankGameMap, GameMap } from '../mapManager';


export const SET_VIEW = 'SET_VIEW';
export const setView = (view: number) => ({ type: SET_VIEW, payload: view });

export const SET_MAP_SEED = 'SET_MAP_SEED';
export const setMapSeed = (seed: number) => ({ type: SET_MAP_SEED, payload: seed });

export const SET_MAP_SIZE = 'SET_MAP_SIZE';
export const setMapSize = (size: number) => ({ type: SET_MAP_SIZE, payload: size });

export const TOGGLE_GRID = 'TOGGLE_GRID';
export const toggleGrid = () => ({ type: TOGGLE_GRID });

export const SELECT_REGION = 'SELECT_REGION';
export const selectRegion = (coordinate: Phaser.Point) => ({ type: SELECT_REGION, payload: coordinate });

export const MOVE_CURSOR = 'MOVE_CURSOR';
export const moveCursor = (coordinate: Phaser.Point) => ({ type: MOVE_CURSOR, payload: coordinate });

export const SET_LOADING = 'SET_LOADING';
export const setLoading = (isLoading: boolean) => ({ type: SET_LOADING, payload: isLoading });

export const TOGGLE_KEYBOARD_HELP = 'TOGGLE_KEYBOARD_HELP';
export const toggleKeyboardHelp = () => ({ type: TOGGLE_KEYBOARD_HELP });

export const SAVE_MAP = 'SAVE_MAP';
export const saveMap = (name: string) => ({ type: SAVE_MAP, payload: name });

export const LOAD_MAP = 'LOAD_MAP';
export const loadMap = (name: string) => ({ type: LOAD_MAP, payload: name });

export const REGEN = 'REGEN';
export const regen = (shouldReload?: boolean) => ({ type: REGEN, payload: shouldReload });

export const FETCH_SAVED_MAPS = 'FETCH_SAVED_MAPS';
export const fetchSavedMaps = () => ({ type: FETCH_SAVED_MAPS });

export const SAVED_MAPS_LOADED = 'SAVED_MAPS_LOADED';
export const savedMapsLoaded = (mapNames: string[]) => ({ type: SAVED_MAPS_LOADED, payload: mapNames });

export const MAP_LOADED = 'MAP_LOADED';
export const mapLoaded = (map: GameMap) => ({ type: MAP_LOADED, payload: map });

export interface UIState {
  view: number,
  showGrid: boolean,
  mapSettings: MapSettings,
  currentRegion: Phaser.Point | null,
  cursor: Phaser.Point | null,
  isLoading: boolean,
  showKeyboardHelp: boolean,
  loadingMaps: boolean,
  savedMaps: string[],
  loadedMapName?: string,
};

const initialState: UIState = {
  view: 0,
  showGrid: false,
  mapSettings: blankGameMap.settings,
  currentRegion: null,
  cursor: null,
  isLoading: false,
  showKeyboardHelp: false,
  loadingMaps: true,
  savedMaps: [],
  loadedMapName: null
};

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_VIEW:
      return {
        ...state,
        view: action.payload,
      };
    case TOGGLE_GRID:
      return {
        ...state,
        showGrid: !state.showGrid,
      };
    case SET_MAP_SIZE:
      return {
        ...state,
        mapSettings: {
          ...state.mapSettings,
          size: action.payload,
        }
      };
    case SET_MAP_SEED:
      return {
        ...state,
        mapSettings: {
          ...state.mapSettings,
          seed: action.payload,
        }
      };
    case SELECT_REGION:
      return {
        ...state,
        currentRegion: action.payload,
      };
    case MOVE_CURSOR:
      return {
        ...state,
        cursor: action.payload,
      };
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case TOGGLE_KEYBOARD_HELP:
      return {
        ...state,
        showKeyboardHelp: !state.showKeyboardHelp,
      };
    case FETCH_SAVED_MAPS:
      return {
        ...state,
        loadingMaps: true,
      };
    case SAVED_MAPS_LOADED:
      return {
        ...state,
        loadingMaps: false,
        savedMaps: action.payload,
      };
    case MAP_LOADED:
      return {
        ...state,
        mapSettings: action.payload.settings,
        loadedMapName: action.payload.mapName,
      };
    default:
      return state;
  }
}