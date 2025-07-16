import React, { useMemo } from 'react';
import { useAppContext } from '../../../../contexts/AppContext';
import { TranslationNode } from '../../../../types/translation';
import TreeNode from './TreeNode';

const TreeView: React.FC = () => {
  const { state } = useAppContext();

  const rootNodes = useMemo(() => {
    if (!state.currentFile) return [];

    const { keySearch, valueSearch, showMissing, showCompleted } = state.searchFilter;
    
    // First, filter all nodes based on search criteria
    const allFilteredNodes = state.currentFile?.nodes?.filter(node => {
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

    // Then, return only root-level nodes (those without a parent or parent is not in filtered set)
    return allFilteredNodes.filter(node => {
      // Root nodes are those that don't have a parent or whose parent is not in the current file
      return !node.parent || !allFilteredNodes.some(n => n.id === node.parent);
    });
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
      {rootNodes.map(node => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  );
};

export default TreeView;