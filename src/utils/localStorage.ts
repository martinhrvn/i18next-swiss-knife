import { AppSettings } from '../types/settings';
import { TranslationFile } from '../types/translation';

const STORAGE_KEY = 'i18n-swiss-knife-state';

export interface StoredState {
  translationFiles: TranslationFile[];
  currentFileLanguage: string | null;
  selectedNodeKey: string | null;
  settings: AppSettings;
  lastSavedAt: number;
  projectConfig?: {
    folderPath: string;
    pattern: string;
  } | null;
}

export const saveToLocalStorage = (state: StoredState): void => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
};

export const loadFromLocalStorage = (): StoredState | null => {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return null;
    
    const parsed = JSON.parse(item) as StoredState;
    
    // Check if the stored state is recent (within 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (parsed.lastSavedAt < sevenDaysAgo) {
      console.log('Stored state is older than 7 days, ignoring');
      clearLocalStorage();
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
    clearLocalStorage();
    return null;
  }
};

export const clearLocalStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
};

export const getStorageSize = (): number => {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? new Blob([item]).size : 0;
  } catch (error) {
    return 0;
  }
};