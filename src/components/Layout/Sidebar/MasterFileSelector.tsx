import React, { useEffect } from 'react';
import { useAppContext } from '../../../contexts/AppContext';

const MasterFileSelector: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { translationFiles, currentFile } = state;

  // Auto-select master file when translation files change
  useEffect(() => {
    if (translationFiles.length > 0 && !currentFile) {
      // Try to find 'en' file first, otherwise use the first file
      const enFile = translationFiles.find(file => 
        file.lang === 'en' || file.lang === 'english'
      );
      const masterFile = enFile || translationFiles[0];
      
      if (masterFile) {
        dispatch({ type: 'SET_CURRENT_FILE', payload: masterFile });
      }
    }
  }, [translationFiles, currentFile, dispatch]);

  const handleMasterFileChange = (selectedLang: string) => {
    const selectedFile = translationFiles.find(file => file.lang === selectedLang);
    if (selectedFile) {
      dispatch({ type: 'SET_CURRENT_FILE', payload: selectedFile });
      // Also clear any selected node when switching files
      dispatch({ type: 'SET_SELECTED_NODE', payload: null });
    }
  };

  if (translationFiles.length === 0) {
    return null;
  }

  return (
    <div className="master-file-selector">
      <label className="master-file-label">
        Master Language:
      </label>
      <select 
        className="master-file-dropdown"
        value={currentFile?.lang || ''}
        onChange={(e) => handleMasterFileChange(e.target.value)}
      >
        {translationFiles.map(file => (
          <option key={file.lang} value={file.lang}>
            {file.lang} {file.error ? '(Error)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MasterFileSelector;