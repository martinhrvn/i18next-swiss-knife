import React from 'react';
import SearchInputs from './SearchInputs';
import FilterButtons from './FilterButtons';
import TreeView from './TreeView/TreeView';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <SearchInputs />
      <FilterButtons />
      <TreeView />
    </div>
  );
};

export default Sidebar;