import React from 'react';
import { useAppContext } from '../../../../contexts/AppContext';
import { TranslationNode } from '../../../../types/translation';

interface TreeNodeProps {
  node: TranslationNode;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0 }) => {
  const { state, dispatch } = useAppContext();
  const isSelected = state.selectedNode?.id === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = node.isExpanded;

  const handleClick = () => {
    dispatch({ type: 'SET_SELECTED_NODE', payload: node });
  };

  const handleToggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      dispatch({ type: 'TOGGLE_NODE_EXPANSION', payload: node.id });
    }
  };

  const paddingLeft = level * 16 + 8;
  
  // Extract just the current level name from the full key path
  const displayName = node.key.split('.').pop() || node.key;

  return (
    <>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''} ${hasChildren ? 'has-children' : ''}`}
        onClick={handleClick}
        style={{ paddingLeft }}
      >
        <div className="tree-node-content">
          {hasChildren && (
            <span
              className="tree-node-icon"
              onClick={handleToggleExpansion}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="tree-node-key">{displayName}</span>
        </div>
      </div>
      
      {hasChildren && isExpanded && node.children && (
        <>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </>
      )}
    </>
  );
};

export default TreeNode;