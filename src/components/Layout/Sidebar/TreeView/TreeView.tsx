import React, { useMemo } from 'react';
import { useAppContext } from '../../../../contexts/AppContext';
import { TranslationNode } from '../../../../types/translation';
import TreeNode from './TreeNode';

const TreeView: React.FC = () => {
  const { state } = useAppContext();

  const filteredNodes = useMemo(() => {
    if (!state.currentFile) return [];

    const { keySearch, valueSearch, showMissing, showCompleted } = state.searchFilter;
    
    return state.currentFile?.nodes?.filter(node => {
      const matchesKeySearch = !keySearch || 
        node.key.toLowerCase().includes(keySearch.toLowerCase());
      
      const matchesValueSearch = !valueSearch || 
        node.value.toLowerCase().includes(valueSearch.toLowerCase());
      
      const isMissing = !node.value || node.value.trim() === '';
      const isCompleted = node.value && node.value.trim() !== '';
      
      const matchesFilter = 
        (showMissing && isMissing) || 
        (showCompleted && isCompleted);
      
      return matchesKeySearch && matchesValueSearch && matchesFilter;
    }) ?? [];
  }, [state.currentFile, state.searchFilter]);

  if (!state.currentFile) {
    return (
      <div className="tree-view">
        <p>No file loaded</p>
      </div>
    );
  }

  return (
    <div className="tree-view">
      {filteredNodes.map(node => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  );
};

export default TreeView;