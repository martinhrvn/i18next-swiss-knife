export interface AppSettings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  defaultLanguage: string;
  recentFiles: string[];
  windowState: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
}