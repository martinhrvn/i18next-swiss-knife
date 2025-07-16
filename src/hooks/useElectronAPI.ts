import { useCallback } from 'react';
import '../types/electron';

export const useElectronAPI = () => {
  const selectFolder = useCallback(async (): Promise<string | null> => {
    try {
      const result = await window.electronAPI.selectFolder();
      return result;
    } catch (error) {
      console.error('Failed to select folder:', error);
      return null;
    }
  }, []);

  const loadTranslationFiles = useCallback(async (folderPath: string, pattern: string): Promise<any[]> => {
    try {
      const result = await window.electronAPI.loadTranslationFiles(folderPath, pattern);
      return result;
    } catch (error) {
      console.error('Failed to load translation files:', error);
      return [];
    }
  }, []);

  const saveTranslationFiles = useCallback(async (changes: any): Promise<void> => {
    try {
      await window.electronAPI.saveTranslationFiles(changes);
    } catch (error) {
      console.error('Failed to save translation files:', error);
    }
  }, []);

  // Legacy methods - commented out for now
  /*
  const openFile = useCallback(async (): Promise<string | null> => {
    try {
      const result = await window.electronAPI.openFile?.();
      return result || null;
    } catch (error) {
      console.error('Failed to open file:', error);
      return null;
    }
  }, []);

  const saveFile = useCallback(async (defaultPath?: string): Promise<string | null> => {
    try {
      const result = await window.electronAPI.saveFile?.(defaultPath);
      return result || null;
    } catch (error) {
      console.error('Failed to save file:', error);
      return null;
    }
  }, []);

  const showMessageBox = useCallback(async (
    type: 'info' | 'warning' | 'error',
    title: string,
    message: string
  ): Promise<void> => {
    try {
      await window.electronAPI.showMessageBox?.(type, title, message);
    } catch (error) {
      console.error('Failed to show message box:', error);
    }
  }, []);

  const getVersion = useCallback(async (): Promise<string> => {
    try {
      return await window.electronAPI.getVersion?.() || 'Unknown';
    } catch (error) {
      console.error('Failed to get version:', error);
      return 'Unknown';
    }
  }, []);
  */

  return {
    selectFolder,
    loadTranslationFiles,
    saveTranslationFiles,
    // Legacy methods - uncomment if needed
    // openFile,
    // saveFile,
    // showMessageBox,
    // getVersion,
  };
};

