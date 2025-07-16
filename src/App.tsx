import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Layout from './components/Layout/Layout';
import './App.css';

const StorageStatusIndicator: React.FC = () => {
  const { state } = useAppContext();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (state.isRestoredFromStorage) {
      setShowIndicator(true);
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.isRestoredFromStorage]);

  if (!showIndicator) return null;

  return (
    <div className="storage-status">
      State restored from previous session
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="app">
      <Layout />
      <StorageStatusIndicator />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;