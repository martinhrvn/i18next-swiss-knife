export interface TranslationNode {
  id: string;
  key: string;
  value: string;
  children?: TranslationNode[];
  parent?: string;
  isExpanded?: boolean;
}

export interface TranslationFile {
  path: string;
  data: Record<string, any>;
  nodes: TranslationNode[];
  lang: string;
  error?: string;
}

export interface SearchFilter {
  keySearch: string;
  valueSearch: string;
  showMissing: boolean;
  showCompleted: boolean;
}