import { AppSettings } from './settings';

export interface ElectronAPI {
  // Folder and file operations
  selectFolder: () => Promise<string | null>;
  loadTranslationFiles: (folderPath: string, pattern: string) => Promise<any[]>;
  saveTranslationFiles: (changes: any) => Promise<void>;
  
  // Legacy file operations (if needed)
  loadTranslationFile?: (filePath: string) => Promise<Record<string, any>>;
  saveTranslationFile?: (filePath: string, data: Record<string, any>) => Promise<void>;
  openFile?: () => Promise<string | null>;
  saveFile?: (defaultPath?: string) => Promise<string | null>;
  
  // Settings
  loadSettings?: () => Promise<AppSettings>;
  saveSettings?: (settings: Partial<AppSettings>) => Promise<void>;
  
  // UI
  showMessageBox?: (type: 'info' | 'warning' | 'error', title: string, message: string) => Promise<void>;
  getVersion?: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}