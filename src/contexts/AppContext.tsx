import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { TranslationFile, TranslationNode, SearchFilter } from '../types/translation';
import { AppSettings } from '../types/settings';
import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage, StoredState } from '../utils/localStorage';

interface AppState {
  translationFiles: TranslationFile[];
  currentFile: TranslationFile | null;
  selectedNode: TranslationNode | null;
  searchFilter: SearchFilter;
  settings: AppSettings;
  isLoading: boolean;
  isRestoredFromStorage: boolean;
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
  | { type: 'CLEAR_ALL_FILES' }
  | { type: 'LOAD_STORED_STATE'; payload: StoredState };

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
  isRestoredFromStorage: false,
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
      const toggleExpansionInNodes = (nodes: TranslationNode[]): TranslationNode[] => {
        return nodes.map(node => {
          if (node.id === action.payload) {
            return { ...node, isExpanded: !node.isExpanded };
          }
          if (node.children) {
            return { ...node, children: toggleExpansionInNodes(node.children) };
          }
          return node;
        });
      };

      return {
        ...state,
        currentFile: state.currentFile && state.currentFile.nodes
          ? {
              ...state.currentFile,
              nodes: toggleExpansionInNodes(state.currentFile.nodes),
            }
          : state.currentFile,
      };
    case 'CLEAR_ALL_FILES':
      // Clear localStorage when clearing files
      clearLocalStorage();
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
    case 'LOAD_STORED_STATE':
      const storedState = action.payload;
      // Find the current file by language
      const currentFile = storedState.translationFiles.find(
        file => file.lang === storedState.currentFileLanguage
      ) || null;
      
      // Find the selected node by key
      let selectedNode: TranslationNode | null = null;
      if (storedState.selectedNodeKey && currentFile) {
        const findNodeByKey = (nodes: TranslationNode[], targetKey: string): TranslationNode | null => {
          for (const node of nodes) {
            if (node.key === targetKey) return node;
            if (node.children) {
              const found = findNodeByKey(node.children, targetKey);
              if (found) return found;
            }
          }
          return null;
        };
        selectedNode = findNodeByKey(currentFile.nodes, storedState.selectedNodeKey);
      }
      
      return {
        ...state,
        translationFiles: storedState.translationFiles,
        currentFile,
        selectedNode,
        settings: { ...state.settings, ...storedState.settings },
        isRestoredFromStorage: true
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

  // Load stored state on mount
  useEffect(() => {
    const storedState = loadFromLocalStorage();
    if (storedState) {
      console.log('Loading stored state from localStorage');
      dispatch({ type: 'LOAD_STORED_STATE', payload: storedState });
    }
  }, []);

  // Save state to localStorage when relevant state changes
  useEffect(() => {
    // Only save if we have translation files loaded
    if (state.translationFiles.length > 0) {
      const stateToSave: StoredState = {
        translationFiles: state.translationFiles,
        currentFileLanguage: state.currentFile?.lang || null,
        selectedNodeKey: state.selectedNode?.key || null,
        settings: state.settings,
        lastSavedAt: Date.now()
      };
      
      saveToLocalStorage(stateToSave);
    }
  }, [
    state.translationFiles,
    state.currentFile?.lang,
    state.selectedNode?.key,
    state.settings
  ]);

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