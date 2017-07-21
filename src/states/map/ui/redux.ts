import { MapSettings, blankGameMap } from '../mapManager';


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

export const SELECT_SECTOR = 'SELECT_SECTOR';
export const selectSector = (coordinate: Phaser.Point) => ({ type: SELECT_SECTOR, payload: coordinate });

export const MOVE_CURSOR = 'MOVE_CURSOR';
export const moveCursor = (coordinate: Phaser.Point) => ({ type: MOVE_CURSOR, payload: coordinate });

export const SET_LOADING = 'SET_LOADING';
export const setLoading = (isLoading: boolean) => ({ type: SET_LOADING, payload: isLoading });

export const TOGGLE_KEYBOARD_HELP = 'TOGGLE_KEYBOARD_HELP';
export const toggleKeyboardHelp = () => ({ type: TOGGLE_KEYBOARD_HELP });

export interface UIState {
  view: number,
  showGrid: boolean,
  mapSettings: MapSettings,
  currentRegion: Phaser.Point | null,
  currentSector: Phaser.Point | null,
  cursor: Phaser.Point | null,
  isLoading: boolean,
  showKeyboardHelp: boolean,
};

const initialState: UIState = {
  view: 4,
  showGrid: false,
  mapSettings: blankGameMap.settings,
  currentRegion: null,
  currentSector: null,
  cursor: null,
  isLoading: false,
  showKeyboardHelp: false,
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
    case SELECT_SECTOR:
      return {
        ...state,
        currentSector: action.payload,
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
    default:
      return state;
  }
}