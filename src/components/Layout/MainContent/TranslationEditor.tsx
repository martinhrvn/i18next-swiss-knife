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

  // Initialize edited values when selected node changes
  useEffect(() => {
    if (state.selectedNode && languageValues.length > 0) {
      const initialValues: Record<string, string> = {};
      
      // For leaf nodes
      languageValues.forEach(langValue => {
        initialValues[langValue.lang] = langValue.value;
      });
      
      // For nodes with children - initialize table values
      if (!isLeafNode && state.selectedNode.children) {
        const children = state.selectedNode.children.slice(0, 50);
        children.forEach(child => {
          state.translationFiles.forEach(file => {
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

            const nodeInFile = findNodeInFile(file.nodes, child.key);
            const value = nodeInFile?.value || '';
            const tableKey = `${child.key}:${file.lang}`;
            initialValues[tableKey] = value;
          });
        });
      }
      
      setEditedValues(initialValues);
    }
  }, [state.selectedNode, languageValues, isLeafNode, state.translationFiles]);

  // Get children of selected node (first 50) with their values across all languages
  const childrenWithValues = useMemo(() => {
    if (!state.selectedNode || !state.selectedNode.children || !state.translationFiles) return [];
    
    const children = state.selectedNode.children.slice(0, 50);
    
    return children.map(child => {
      // Get values for this child across all languages
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

        const nodeInFile = findNodeInFile(file.nodes, child.key);
        const value = nodeInFile?.value || '';
        // Only show validation errors for leaf nodes (nodes without children)
        const isLeaf = !nodeInFile?.children || nodeInFile.children.length === 0;
        const hasError = isLeaf && (!value || value.trim() === '');
        
        return {
          lang: file.lang,
          value: value,
          hasError: hasError,
          file: file
        };
      });

      return {
        child,
        languageValues,
        displayName: child.key.split('.').pop() || child.key
      };
    });
  }, [state.selectedNode, state.translationFiles]);

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

  const updateEditedValue = (lang: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [lang]: value
    }));
  };

  const handleSave = () => {
    // For now, we'll only save the current file's value
    // TODO: Implement cross-file saving
    if (state.selectedNode && state.currentFile) {
      const currentLang = state.currentFile.lang;
      const newValue = editedValues[currentLang];
      
      if (newValue !== state.selectedNode.value) {
        dispatch({
          type: 'UPDATE_NODE_VALUE',
          payload: {
            nodeId: state.selectedNode.id,
            value: newValue,
          },
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const hasChanges = useMemo(() => {
    // Check for leaf node changes
    const leafChanges = languageValues.some(langValue => 
      editedValues[langValue.lang] !== langValue.value
    );
    
    // Check for children card changes
    const childChanges = childrenWithValues.some(item =>
      item.languageValues.some(langValue => {
        const tableKey = `${item.child.key}:${langValue.lang}`;
        return editedValues[tableKey] !== langValue.value;
      })
    );
    
    return leafChanges || childChanges;
  }, [editedValues, languageValues, childrenWithValues]);

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
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="save-button-header"
        >
          Save Changes (Ctrl+S)
        </button>
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
        /* Node with Children - Show Cards */
        <div className="children-cards-container">
          <div className="children-header">
            <h4>Children ({state.selectedNode.children?.length || 0})</h4>
            {(state.selectedNode.children?.length || 0) > 50 && (
              <span className="showing-count">Showing first 50</span>
            )}
          </div>
          
          <div className="children-cards">
            {childrenWithValues.map((item) => (
              <div key={item.child.id} className="child-card">
                <div className="card-header">
                  <button
                    className="key-button"
                    onClick={() => handleChildClick(item.child)}
                    title="Click to navigate to this key"
                  >
                    {item.displayName}
                    {item.child.children && <span className="child-indicator">📁</span>}
                  </button>
                </div>
                
                <div className="card-languages">
                  {item.languageValues.map((langValue) => (
                    <div key={langValue.lang} className="card-language-editor">
                      <div className="card-language-header">
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
                        value={editedValues[`${item.child.key}:${langValue.lang}`] || langValue.value}
                        onChange={(e) => updateEditedValue(`${item.child.key}:${langValue.lang}`, e.target.value)}
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