import React from 'react';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout/Layout';
import './App.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="app">
        <Layout />
      </div>
    </AppProvider>
  );
};

export default App;