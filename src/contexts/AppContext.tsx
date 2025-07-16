import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { TranslationFile, TranslationNode, SearchFilter } from '../types/translation';
import { AppSettings } from '../types/settings';
import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage, StoredState } from '../utils/localStorage';

interface ProjectConfig {
  folderPath: string;
  pattern: string;
}

interface AppState {
  translationFiles: TranslationFile[];
  currentFile: TranslationFile | null;
  selectedNode: TranslationNode | null;
  searchFilter: SearchFilter;
  settings: AppSettings;
  isLoading: boolean;
  isRestoredFromStorage: boolean;
  projectConfig: ProjectConfig | null;
}

type AppAction =
  | { type: 'SET_TRANSLATION_FILES'; payload: TranslationFile[] }
  | { type: 'SET_CURRENT_FILE'; payload: TranslationFile | null }
  | { type: 'SET_SELECTED_NODE'; payload: TranslationNode | null }
  | { type: 'UPDATE_SEARCH_FILTER'; payload: Partial<SearchFilter> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_NODE_VALUE'; payload: { nodeId: string; value: string } }
  | { type: 'UPDATE_MULTIPLE_NODE_VALUES'; payload: { updates: Array<{ nodeKey: string; lang: string; value: string }> } }
  | { type: 'RELOAD_TRANSLATION_FILES'; payload: TranslationFile[] }
  | { type: 'TOGGLE_NODE_EXPANSION'; payload: string }
  | { type: 'CLEAR_ALL_FILES' }
  | { type: 'LOAD_STORED_STATE'; payload: StoredState }
  | { type: 'SET_PROJECT_CONFIG'; payload: ProjectConfig };

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
  projectConfig: null,
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
    case 'UPDATE_MULTIPLE_NODE_VALUES':
      // Helper function to update a node's value in a tree
      const updateNodeValueInTree = (nodes: TranslationNode[], targetKey: string, newValue: string): TranslationNode[] => {
        return nodes.map(node => {
          if (node.key === targetKey) {
            return { ...node, value: newValue };
          }
          if (node.children) {
            return { ...node, children: updateNodeValueInTree(node.children, targetKey, newValue) };
          }
          return node;
        });
      };

      // Update all translation files with the new values
      const updatedFiles = state.translationFiles.map(file => {
        let hasUpdates = false;
        let updatedNodes = file.nodes;
        let updatedData = { ...file.data };

        // Apply all updates for this file's language
        action.payload.updates.forEach(update => {
          if (update.lang === file.lang) {
            updatedNodes = updateNodeValueInTree(updatedNodes, update.nodeKey, update.value);
            
            // Also update the data object for persistence
            const keys = update.nodeKey.split('.');
            let current = updatedData;
            for (let i = 0; i < keys.length - 1; i++) {
              if (!current[keys[i]]) current[keys[i]] = {};
              current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = update.value;
            
            hasUpdates = true;
          }
        });

        return hasUpdates ? { ...file, nodes: updatedNodes, data: updatedData } : file;
      });

      // Update current file if it was modified
      const updatedCurrentFile = state.currentFile ? 
        updatedFiles.find(file => file.lang === state.currentFile?.lang) || state.currentFile 
        : null;

      return {
        ...state,
        translationFiles: updatedFiles,
        currentFile: updatedCurrentFile,
      };
    case 'RELOAD_TRANSLATION_FILES':
      // Find the current file in the reloaded files
      const reloadedCurrentFile = state.currentFile ? 
        action.payload.find(file => file.lang === state.currentFile?.lang) || null 
        : null;
      
      // Try to preserve the selected node if it still exists
      let preservedSelectedNode: TranslationNode | null = null;
      if (state.selectedNode && reloadedCurrentFile) {
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
        preservedSelectedNode = findNodeByKey(reloadedCurrentFile.nodes, state.selectedNode.key);
      }

      return {
        ...state,
        translationFiles: action.payload,
        currentFile: reloadedCurrentFile,
        selectedNode: preservedSelectedNode,
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
        projectConfig: storedState.projectConfig || null,
        isRestoredFromStorage: true
      };
    case 'SET_PROJECT_CONFIG':
      return {
        ...state,
        projectConfig: action.payload
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
        lastSavedAt: Date.now(),
        projectConfig: state.projectConfig
      };
      
      saveToLocalStorage(stateToSave);
    }
  }, [
    state.translationFiles,
    state.currentFile?.lang,
    state.selectedNode?.key,
    state.settings,
    state.projectConfig
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