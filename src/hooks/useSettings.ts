import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { AppSettings } from '../types/settings';
import '../types/electron';

export const useSettings = () => {
  const { state, dispatch } = useAppContext();

  const loadSettings = useCallback(async () => {
    try {
      if (window.electronAPI.loadSettings) {
        const settings = await window.electronAPI.loadSettings();
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [dispatch]);

  const saveSettings = useCallback(async (settings: Partial<AppSettings>) => {
    try {
      if (window.electronAPI.saveSettings) {
        await window.electronAPI.saveSettings(settings);
      }
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [dispatch]);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const update = { [key]: value } as Partial<AppSettings>;
    await saveSettings(update);
  }, [saveSettings]);

  const addRecentFile = useCallback(async (filePath: string) => {
    const currentRecent = state.settings.recentFiles;
    const newRecent = [filePath, ...currentRecent.filter(f => f !== filePath)].slice(0, 10);
    
    await updateSetting('recentFiles', newRecent);
  }, [state.settings.recentFiles, updateSetting]);

  const clearRecentFiles = useCallback(async () => {
    await updateSetting('recentFiles', []);
  }, [updateSetting]);

  const toggleTheme = useCallback(async () => {
    const newTheme = state.settings.theme === 'light' ? 'dark' : 'light';
    await updateSetting('theme', newTheme);
  }, [state.settings.theme, updateSetting]);

  return {
    settings: state.settings,
    loadSettings,
    saveSettings,
    updateSetting,
    addRecentFile,
    clearRecentFiles,
    toggleTheme,
  };
};

