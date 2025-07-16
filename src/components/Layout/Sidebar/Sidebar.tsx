import React, { useState } from 'react';
import SearchInputs from './SearchInputs';
import FilterButtons from './FilterButtons';
import TreeView from './TreeView/TreeView';
import MasterFileSelector from './MasterFileSelector';
import ConfigModal from '../../Modals/ConfigModal';
import { useAppContext } from '../../../contexts/AppContext';

const Sidebar: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { dispatch } = useAppContext();

  const handleRestartWizard = () => {
    if (confirm('This will clear all loaded files and restart the setup wizard. Are you sure?')) {
      dispatch({ type: 'CLEAR_ALL_FILES' });
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button 
          className="restart-wizard-button"
          onClick={handleRestartWizard}
          title="Restart Setup Wizard"
        >
          🔄
        </button>
        <button 
          className="settings-button"
          onClick={() => setIsSettingsOpen(true)}
          title="Settings"
        >
          ⚙️
        </button>
      </div>
      <MasterFileSelector />
      <SearchInputs />
      <FilterButtons />
      <TreeView />
      
      <ConfigModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default Sidebar;