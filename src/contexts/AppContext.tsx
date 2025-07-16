import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TranslationFile, TranslationNode, SearchFilter } from '../types/translation';
import { AppSettings } from '../types/settings';

interface AppState {
  translationFiles: TranslationFile[];
  currentFile: TranslationFile | null;
  selectedNode: TranslationNode | null;
  searchFilter: SearchFilter;
  settings: AppSettings;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_TRANSLATION_FILES'; payload: TranslationFile[] }
  | { type: 'SET_CURRENT_FILE'; payload: TranslationFile | null }
  | { type: 'SET_SELECTED_NODE'; payload: TranslationNode | null }
  | { type: 'UPDATE_SEARCH_FILTER'; payload: Partial<SearchFilter> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_NODE_VALUE'; payload: { nodeId: string; value: string } }
  | { type: 'TOGGLE_NODE_EXPANSION'; payload: string }
  | { type: 'CLEAR_ALL_FILES' };

const initialState: AppState = {
  translationFiles: [],
  currentFile: null,
  selectedNode: null,
  searchFilter: {
    keySearch: '',
    valueSearch: '',
    showMissing: true,
    showCompleted: true,
  },
  settings: {
    theme: 'light',
    autoSave: true,
    defaultLanguage: 'en',
    recentFiles: [],
    windowState: {
      width: 1200,
      height: 800,
    },
  },
  isLoading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TRANSLATION_FILES':
      return { ...state, translationFiles: action.payload };
    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.payload };
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.payload };
    case 'UPDATE_SEARCH_FILTER':
      return {
        ...state,
        searchFilter: { ...state.searchFilter, ...action.payload },
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_NODE_VALUE':
      return {
        ...state,
        currentFile: state.currentFile && state.currentFile.nodes
          ? {
              ...state.currentFile,
              nodes: state.currentFile.nodes.map(node =>
                node.id === action.payload.nodeId
                  ? { ...node, value: action.payload.value }
                  : node
              ),
            }
          : state.currentFile,
      };
    case 'TOGGLE_NODE_EXPANSION':
      return {
        ...state,
        currentFile: state.currentFile && state.currentFile.nodes
          ? {
              ...state.currentFile,
              nodes: state.currentFile.nodes.map(node =>
                node.id === action.payload
                  ? { ...node, isExpanded: !node.isExpanded }
                  : node
              ),
            }
          : state.currentFile,
      };
    case 'CLEAR_ALL_FILES':
      return {
        ...state,
        translationFiles: [],
        currentFile: null,
        selectedNode: null,
        searchFilter: {
          keySearch: '',
          valueSearch: '',
          showMissing: true,
          showCompleted: true,
        },
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};