import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TranslationFile, TranslationNode } from '../types/translation';
import '../types/electron';

export const useTranslations = () => {
  const { state, dispatch } = useAppContext();

  const loadTranslationFile = useCallback(async (filePath: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (window.electronAPI.loadTranslationFile) {
        const data = await window.electronAPI.loadTranslationFile(filePath);
        const nodes = flattenTranslationData(data);
        
        const translationFile: TranslationFile = {
          path: filePath,
          data,
          nodes,
        };
        
        dispatch({ type: 'SET_CURRENT_FILE', payload: translationFile });
        
        const existingFiles = state.translationFiles.filter(f => f.path !== filePath);
        dispatch({ 
          type: 'SET_TRANSLATION_FILES', 
          payload: [...existingFiles, translationFile] 
        });
      }
    } catch (error) {
      console.error('Failed to load translation file:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, state.translationFiles]);

  const saveTranslationFile = useCallback(async (filePath?: string) => {
    if (!state.currentFile) return;
    
    const targetPath = filePath || state.currentFile.path;
    const data = unflattenTranslationData(state.currentFile.nodes);
    
    try {
      if (window.electronAPI.saveTranslationFile) {
        await window.electronAPI.saveTranslationFile(targetPath, data);
      }
      
      dispatch({
        type: 'SET_CURRENT_FILE',
        payload: { ...state.currentFile, path: targetPath, data }
      });
      
    } catch (error) {
      console.error('Failed to save translation file:', error);
    }
  }, [state.currentFile, dispatch]);

  const addTranslationNode = useCallback((parentKey: string, key: string, value: string) => {
    if (!state.currentFile) return;
    
    const newNode: TranslationNode = {
      id: `${parentKey}.${key}`,
      key: parentKey ? `${parentKey}.${key}` : key,
      value,
      parent: parentKey || undefined,
    };
    
    const updatedNodes = [...state.currentFile.nodes, newNode];
    
    dispatch({
      type: 'SET_CURRENT_FILE',
      payload: { ...state.currentFile, nodes: updatedNodes }
    });
  }, [state.currentFile, dispatch]);

  const deleteTranslationNode = useCallback((nodeId: string) => {
    if (!state.currentFile) return;
    
    const updatedNodes = state.currentFile.nodes.filter(node => node.id !== nodeId);
    
    dispatch({
      type: 'SET_CURRENT_FILE',
      payload: { ...state.currentFile, nodes: updatedNodes }
    });
  }, [state.currentFile, dispatch]);

  return {
    loadTranslationFile,
    saveTranslationFile,
    addTranslationNode,
    deleteTranslationNode,
    isLoading: state.isLoading,
    currentFile: state.currentFile,
    translationFiles: state.translationFiles,
  };
};

function flattenTranslationData(data: Record<string, any>, prefix = ''): TranslationNode[] {
  const nodes: TranslationNode[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      nodes.push({
        id: fullKey,
        key: fullKey,
        value: '',
        children: flattenTranslationData(value, fullKey),
        isExpanded: false,
      });
    } else {
      nodes.push({
        id: fullKey,
        key: fullKey,
        value: String(value || ''),
        parent: prefix || undefined,
      });
    }
  });
  
  return nodes;
}

function unflattenTranslationData(nodes: TranslationNode[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  nodes.forEach(node => {
    if (!node.children) {
      const keys = node.key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = node.value;
    }
  });
  
  return result;
}

