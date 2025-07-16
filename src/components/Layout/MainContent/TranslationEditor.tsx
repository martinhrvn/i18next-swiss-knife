import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { TranslationNode, TranslationFile } from '../../../types/translation';

interface LanguageValue {
  lang: string;
  value: string;
  hasError: boolean;
  file: TranslationFile;
}

const TranslationEditor: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  // Get values for the selected key across all language files
  const languageValues = useMemo(() => {
    if (!state.selectedNode || !state.translationFiles) return [];

    const selectedKey = state.selectedNode.key;
    
    return state.translationFiles.map(file => {
      // Find the node with matching key in this file
      const findNodeInFile = (nodes: TranslationNode[], targetKey: string): TranslationNode | null => {
        for (const node of nodes) {
          if (node.key === targetKey) return node;
          if (node.children) {
            const found = findNodeInFile(node.children, targetKey);
            if (found) return found;
          }
        }
        return null;
      };

      const nodeInFile = findNodeInFile(file.nodes, selectedKey);
      const value = nodeInFile?.value || '';
      const hasError = !value || value.trim() === '';

      return {
        lang: file.lang,
        value: value,
        hasError: hasError,
        file: file
      } as LanguageValue;
    });
  }, [state.selectedNode, state.translationFiles]);

  // Check if selected node is a leaf (has no children)
  const isLeafNode = !state.selectedNode?.children || state.selectedNode.children.length === 0;

  // Get all leaf descendants of selected node with their values across all languages
  const leafDescendants = useMemo(() => {
    if (!state.selectedNode || !state.translationFiles) return [];
    
    // Function to collect all leaf nodes recursively
    const collectLeafNodes = (node: TranslationNode): TranslationNode[] => {
      if (!node.children || node.children.length === 0) {
        // This is a leaf node
        return [node];
      }
      
      // This is a parent node, collect leaves from all children
      const leaves: TranslationNode[] = [];
      for (const child of node.children) {
        leaves.push(...collectLeafNodes(child));
      }
      return leaves;
    };
    
    const leafNodes = collectLeafNodes(state.selectedNode);
    
    return leafNodes.map(leafNode => {
      // Get values for this leaf across all languages
      const languageValues = state.translationFiles.map(file => {
        const findNodeInFile = (nodes: TranslationNode[], targetKey: string): TranslationNode | null => {
          for (const node of nodes) {
            if (node.key === targetKey) return node;
            if (node.children) {
              const found = findNodeInFile(node.children, targetKey);
              if (found) return found;
            }
          }
          return null;
        };

        const nodeInFile = findNodeInFile(file.nodes, leafNode.key);
        const value = nodeInFile?.value || '';
        const hasError = !value || value.trim() === '';
        
        return {
          lang: file.lang,
          value: value,
          hasError: hasError,
          file: file
        };
      });

      return {
        leaf: leafNode,
        languageValues,
        displayName: leafNode.key.split('.').pop() || leafNode.key,
        fullKey: leafNode.key
      };
    });
  }, [state.selectedNode, state.translationFiles]);

  // Initialize edited values when selected node changes
  useEffect(() => {
    if (state.selectedNode && languageValues.length > 0) {
      const initialValues: Record<string, string> = {};
      
      // For leaf nodes
      languageValues.forEach(langValue => {
        initialValues[langValue.lang] = langValue.value;
      });
      
      // For nodes with children - initialize values for all leaf descendants
      if (!isLeafNode) {
        leafDescendants.forEach(item => {
          item.languageValues.forEach(langValue => {
            const tableKey = `${item.leaf.key}:${langValue.lang}`;
            initialValues[tableKey] = langValue.value;
          });
        });
      }
      
      setEditedValues(initialValues);
    }
  }, [state.selectedNode, languageValues, isLeafNode, state.translationFiles, leafDescendants]);

  // Create breadcrumb segments from the key
  const breadcrumbSegments = useMemo(() => {
    if (!state.selectedNode) return [];
    
    const keyParts = state.selectedNode.key.split('.');
    return keyParts.map((part, index) => ({
      text: part,
      fullKey: keyParts.slice(0, index + 1).join('.'),
      isLast: index === keyParts.length - 1
    }));
  }, [state.selectedNode]);

  // Find and select a node by key
  const findNodeByKey = (key: string): TranslationNode | null => {
    if (!state.currentFile) return null;
    
    const searchInNodes = (nodes: TranslationNode[]): TranslationNode | null => {
      for (const node of nodes) {
        if (node.key === key) return node;
        if (node.children) {
          const found = searchInNodes(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchInNodes(state.currentFile.nodes);
  };

  const handleBreadcrumbClick = (fullKey: string) => {
    const targetNode = findNodeByKey(fullKey);
    if (targetNode) {
      dispatch({ type: 'SET_SELECTED_NODE', payload: targetNode });
    }
  };

  const handleChildClick = (child: TranslationNode) => {
    dispatch({ type: 'SET_SELECTED_NODE', payload: child });
  };

  const updateEditedValue = (key: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Helper function to flatten translation data into nodes (copied from SetupWizard)
  const flattenTranslationData = (data: Record<string, any>, prefix = '') => {
    const nodes: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // This is a nested object - create parent node and recurse
        nodes.push({
          id: fullKey,
          key: fullKey,
          value: '',
          parent: prefix || undefined,
          children: flattenTranslationData(value, fullKey),
        });
      } else {
        // This is a leaf node
        nodes.push({
          id: fullKey,
          key: fullKey,
          value: String(value || ''),
          parent: prefix || undefined,
        });
      }
    });
    
    return nodes;
  };

  const reloadTranslationFiles = async () => {
    if (!state.translationFiles.length || !state.projectConfig) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const { folderPath, pattern } = state.projectConfig;

      console.log('🔄 Reloading files from:', folderPath, 'with pattern:', pattern);

      // Load fresh data from disk
      const foundFiles = await window.electronAPI.loadTranslationFiles(folderPath, pattern);
      
      // Convert to TranslationFile format
      const reloadedFiles = foundFiles
        .filter(file => !file.error && file.content)
        .map(foundFile => {
          const nodes = flattenTranslationData(foundFile.content);
          return {
            path: foundFile.path,
            lang: foundFile.lang,
            data: foundFile.content,
            nodes: nodes,
            relativePath: foundFile.relativePath,
            error: foundFile.error
          };
        });

      // Update the state with reloaded files
      dispatch({
        type: 'RELOAD_TRANSLATION_FILES',
        payload: reloadedFiles
      });

      console.log('✅ Files reloaded successfully');

    } catch (error) {
      console.error('❌ Failed to reload translation files:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSave = async () => {
    console.log('🚀 handleSave called');
    console.log('📝 editedValues:', editedValues);
    console.log('🌿 isLeafNode:', isLeafNode);
    
    const updates: Array<{ nodeKey: string; lang: string; value: string }> = [];

    if (isLeafNode) {
      console.log('🍃 Processing leaf node');
      // Save changes for a single leaf node across all languages
      languageValues.forEach(langValue => {
        const editedValue = editedValues[langValue.lang];
        console.log(`  ${langValue.lang}: "${editedValue}" vs "${langValue.value}"`);
        if (editedValue !== undefined && editedValue !== langValue.value) {
          updates.push({
            nodeKey: state.selectedNode!.key,
            lang: langValue.lang,
            value: editedValue
          });
        }
      });
    } else {
      console.log('📁 Processing parent node with descendants');
      // Save changes for all leaf descendants across all languages
      leafDescendants.forEach(item => {
        item.languageValues.forEach(langValue => {
          const tableKey = `${item.leaf.key}:${langValue.lang}`;
          const editedValue = editedValues[tableKey];
          console.log(`  ${item.leaf.key}[${langValue.lang}]: "${editedValue}" vs "${langValue.value}"`);
          if (editedValue !== undefined && editedValue !== langValue.value) {
            updates.push({
              nodeKey: item.leaf.key,
              lang: langValue.lang,
              value: editedValue
            });
          }
        });
      });
    }

    console.log('📊 Updates to apply:', updates);

    if (updates.length > 0) {
      try {
        // Set loading state
        dispatch({ type: 'SET_LOADING', payload: true });

        // Update state first
        dispatch({
          type: 'UPDATE_MULTIPLE_NODE_VALUES',
          payload: { updates }
        });

        // Prepare changes in the format expected by electron API
        const changes: Array<{ filePath: string; keyPath: string; value: string }> = [];
        
        updates.forEach(update => {
          const file = state.translationFiles.find(f => f.lang === update.lang);
          console.log(`🔍 File for ${update.lang}:`, file ? `${file.path} (${file.lang})` : 'NOT FOUND');
          if (file && file.path) {
            changes.push({
              filePath: file.path,
              keyPath: update.nodeKey,
              value: update.value
            });
          }
        });

        console.log('💾 Changes to save to disk:', changes);

        // Save to disk via electron API
        if (changes.length > 0) {
          console.log('📤 Calling electronAPI.saveTranslationFiles...');
          await window.electronAPI.saveTranslationFiles(changes);
          console.log('✅ Save completed successfully');
          
          // Reload files from disk to ensure UI shows the latest saved state
          await reloadTranslationFiles();
          console.log('🔄 Files reloaded after save');
        } else {
          console.log('⚠️ No changes to save to disk');
        }

      } catch (error) {
        console.error('❌ Failed to save translation files:', error);
        // TODO: Show error message to user
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      console.log('ℹ️ No updates detected');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const hasChanges = useMemo(() => {
    if (isLeafNode) {
      // Check for leaf node changes
      return languageValues.some(langValue => 
        editedValues[langValue.lang] !== langValue.value
      );
    } else {
      // Check for leaf descendant changes
      return leafDescendants.some(item =>
        item.languageValues.some(langValue => {
          const tableKey = `${item.leaf.key}:${langValue.lang}`;
          return editedValues[tableKey] !== langValue.value;
        })
      );
    }
  }, [editedValues, languageValues, leafDescendants, isLeafNode]);

  if (!state.selectedNode) {
    return null;
  }

  return (
    <div className="translation-editor">
      {/* Breadcrumb Key Display with Save Button */}
      <div className="key-breadcrumb">
        <div className="breadcrumb-path">
          {breadcrumbSegments.map((segment, index) => (
            <React.Fragment key={segment.fullKey}>
              <span
                className={`breadcrumb-segment ${segment.isLast ? 'current' : 'clickable'}`}
                onClick={() => !segment.isLast && handleBreadcrumbClick(segment.fullKey)}
              >
                {segment.text}
              </span>
              {!segment.isLast && <span className="breadcrumb-separator">.</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="header-buttons">
          <button
            onClick={reloadTranslationFiles}
            disabled={state.isLoading}
            className="reload-button-header"
            title="Reload all files from disk"
          >
            🔄 Reload
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || state.isLoading}
            className="save-button-header"
          >
            Save Changes (Ctrl+S)
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLeafNode ? (
        /* Leaf Node - Show Multi-Language Editor */
        <div className="leaf-editor">
          <div className="languages-grid">
            {languageValues.map((langValue) => (
              <div key={langValue.lang} className="language-editor">
                <div className="language-header">
                  <span className="language-name">{langValue.lang}</span>
                  {langValue.hasError && (
                    <span className="validation-error">Missing translation</span>
                  )}
                  {langValue.lang === state.currentFile?.lang && (
                    <span className="current-master">Master</span>
                  )}
                </div>
                <input
                  type="text"
                  value={editedValues[langValue.lang] || ''}
                  onChange={(e) => updateEditedValue(langValue.lang, e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Enter ${langValue.lang} translation...`}
                  className={`value-input ${langValue.hasError ? 'has-error' : ''}`}
                />
              </div>
            ))}
          </div>

        </div>
      ) : (
        /* Node with Children - Show All Leaf Descendants in Single Column */
        <div className="leaf-descendants-container">
          <div className="descendants-header">
            <h4>Translation Keys ({leafDescendants.length})</h4>
          </div>
          
          <div className="descendants-list">
            {leafDescendants.map((item) => (
              <div key={item.leaf.id} className="descendant-card">
                <div className="descendant-header">
                  <div className="key-display">
                    <span className="full-key">{item.fullKey}</span>
                  </div>
                </div>
                
                <div className="descendant-languages">
                  {item.languageValues.map((langValue) => (
                    <div key={langValue.lang} className="descendant-language-editor">
                      <div className="descendant-language-header">
                        <span className="language-name">{langValue.lang}</span>
                        {langValue.hasError && (
                          <span className="validation-error">Missing translation</span>
                        )}
                        {langValue.lang === state.currentFile?.lang && (
                          <span className="current-master">Master</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editedValues[`${item.leaf.key}:${langValue.lang}`] || langValue.value}
                        onChange={(e) => updateEditedValue(`${item.leaf.key}:${langValue.lang}`, e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Enter ${langValue.lang} translation...`}
                        className={`value-input ${langValue.hasError ? 'has-error' : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationEditor;