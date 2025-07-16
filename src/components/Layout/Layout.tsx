import React from 'react';
import Sidebar from './Sidebar/Sidebar';
import MainContent from './MainContent/MainContent';
import { useAppContext } from '../../contexts/AppContext';

const Layout: React.FC = () => {
  const { state } = useAppContext();
  
  return (
    <div className="layout">
      {state.translationFiles.length > 0 && <Sidebar />}
      <MainContent />
    </div>
  );
};

export default Layout;