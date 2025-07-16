import React from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import WelcomeScreen from './WelcomeScreen';
import TranslationEditor from './TranslationEditor';
import SetupWizard from '../../SetupWizard/SetupWizard';

const MainContent: React.FC = () => {
  const { state } = useAppContext();

  return (
    <div className="main-content">
      {state.translationFiles.length === 0 ? (
        <SetupWizard />
      ) : state.selectedNode ? (
        <TranslationEditor />
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
};

export default MainContent;