import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../contexts/AppContext';

const TranslationEditor: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [editedValue, setEditedValue] = useState('');

  useEffect(() => {
    if (state.selectedNode) {
      setEditedValue(state.selectedNode.value);
    }
  }, [state.selectedNode]);

  const handleSave = () => {
    if (state.selectedNode && editedValue !== state.selectedNode.value) {
      dispatch({
        type: 'UPDATE_NODE_VALUE',
        payload: {
          nodeId: state.selectedNode.id,
          value: editedValue,
        },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!state.selectedNode) {
    return null;
  }

  return (
    <div className="translation-editor">
      <h3>Edit Translation</h3>
      
      <div>
        <label>Key:</label>
        <input
          type="text"
          value={state.selectedNode.key}
          readOnly
          style={{ backgroundColor: '#f5f5f5' }}
        />
      </div>

      <div>
        <label>Value:</label>
        <textarea
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter translation value..."
        />
      </div>

      <button
        onClick={handleSave}
        disabled={editedValue === state.selectedNode.value}
      >
        Save (Ctrl+S)
      </button>
    </div>
  );
};

export default TranslationEditor;