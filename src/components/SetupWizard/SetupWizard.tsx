import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import './SetupWizard.css';

interface FoundFile {
  lang: string;
  path: string;
  relativePath: string;
  content?: Record<string, any>;
  keys?: number;
  error?: string;
}

const SetupWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [folderPath, setFolderPath] = useState('');
  const [filePattern, setFilePattern] = useState('{lang}/common.json');
  const [foundFiles, setFoundFiles] = useState<FoundFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const { dispatch } = useAppContext();

  const handleFolderSelect = async () => {
    const selectedPath = await window.electronAPI.selectFolder();
    if (selectedPath) {
      setFolderPath(selectedPath);
    }
  };

  const handleScanFiles = async () => {
    if (!folderPath || !filePattern) return;

    setIsScanning(true);
    
    try {
      const files = await window.electronAPI.loadTranslationFiles(folderPath, filePattern);
      setFoundFiles(files || []);
      
      // Auto-select valid files (those without errors)
      const validFiles = new Set(
        files?.filter(file => !file.error).map(file => file.path) || []
      );
      setSelectedFiles(validFiles);
      
      if (files && files.length > 0) {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Error scanning files:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const convertToTranslationFile = (foundFile: FoundFile) => {
    if (!foundFile.content) {
      throw new Error('File content is missing');
    }
    
    const nodes = flattenTranslationData(foundFile.content);
    
    return {
      path: foundFile.path,
      lang: foundFile.lang,
      data: foundFile.content,
      nodes: nodes,
      relativePath: foundFile.relativePath,
      error: foundFile.error
    };
  };

  const handleLoadSelectedFiles = async () => {
    const filesToLoad = foundFiles.filter(file => selectedFiles.has(file.path));
    
    if (filesToLoad.length === 0) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Convert FoundFile objects to TranslationFile format
      const translationFiles = filesToLoad
        .filter(file => !file.error && file.content)
        .map(convertToTranslationFile);

      dispatch({ type: 'SET_TRANSLATION_FILES', payload: translationFiles });
      
      // Store the project config to enable proper reloading
      dispatch({ type: 'SET_PROJECT_CONFIG', payload: { folderPath, pattern: filePattern } });
      
      // Set the first file as current, but the MasterFileSelector will handle auto-selection
      if (translationFiles.length > 0) {
        const enFile = translationFiles.find(file => file.lang === 'en' || file.lang === 'english');
        const masterFile = enFile || translationFiles[0];
        dispatch({ type: 'SET_CURRENT_FILE', payload: masterFile });
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleFileSelection = (filePath: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filePath)) {
      newSelection.delete(filePath);
    } else {
      newSelection.add(filePath);
    }
    setSelectedFiles(newSelection);
  };

  const canProceedToStep2 = folderPath.length > 0;
  const canScanFiles = folderPath.length > 0 && filePattern.length > 0;
  const canLoadFiles = selectedFiles.size > 0;

  // Helper function to flatten translation data into nodes
  const flattenTranslationData = (data: Record<string, any>, prefix = '') => {
    const nodes: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        nodes.push({
          id: fullKey,
          key: fullKey,
          value: '',
          children: flattenTranslationData(value, fullKey),
          isExpanded: false,
        });
      } else {
        nodes.push({
          id: fullKey,
          key: fullKey,
          value: String(value || ''),
          parent: prefix || undefined,
        });
      }
    });
    
    return nodes;
  };

  return (
    <div className="setup-wizard">
      <div className="wizard-container">
        <h1 className="wizard-title">Welcome to i18n Swiss Knife</h1>
        <p className="wizard-subtitle">Let's get started by loading your translation files</p>
        
        {/* Progress indicators */}
        <div className="wizard-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
        </div>
        
        <div className="wizard-content">
          {/* Step 1: Select Folder */}
          {currentStep === 1 && (
            <div className="wizard-step">
              <h3>Step 1: Select your project folder</h3>
              <div className="folder-selection">
                <input
                  type="text"
                  value={folderPath}
                  placeholder="No folder selected"
                  readOnly
                  className="folder-input"
                />
                <button onClick={handleFolderSelect} className="btn btn-primary">
                  Browse...
                </button>
              </div>
              
              <div className="wizard-actions">
                <button 
                  onClick={() => setCurrentStep(2)} 
                  disabled={!canProceedToStep2}
                  className="btn btn-primary btn-large"
                >
                  Next: Define Pattern
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Define Pattern */}
          {currentStep === 2 && (
            <div className="wizard-step">
              <h3>Step 2: Define your file pattern</h3>
              <p className="help-text">
                Use {'{lang}'} as a placeholder for language codes
              </p>
              <input
                type="text"
                value={filePattern}
                onChange={(e) => setFilePattern(e.target.value)}
                placeholder="e.g., locales/{lang}.json"
                className="pattern-input"
              />
              <div className="pattern-examples">
                <p className="example-title">Common patterns:</p>
                <ul>
                  <li><code>locales/{'{lang}'}.json</code></li>
                  <li><code>i18n/{'{lang}'}/translation.json</code></li>
                  <li><code>lang/{'{lang}'}.json</code></li>
                </ul>
              </div>
              
              <div className="wizard-actions">
                <button 
                  onClick={() => setCurrentStep(1)} 
                  className="btn btn-secondary"
                >
                  Back
                </button>
                <button 
                  onClick={handleScanFiles} 
                  disabled={!canScanFiles || isScanning}
                  className="btn btn-primary btn-large"
                >
                  {isScanning ? 'Scanning...' : 'Scan for Files'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Files */}
          {currentStep === 3 && (
            <div className="wizard-step">
              <h3>Step 3: Select files to load</h3>
              <p className="help-text">
                Found {foundFiles.length} files matching your pattern. Select which ones to load:
              </p>
              
              <div className="file-list">
                {foundFiles.map((file) => (
                  <div key={file.path} className={`file-item ${file.error ? 'error' : ''}`}>
                    <label className="file-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.path)}
                        onChange={() => toggleFileSelection(file.path)}
                        disabled={!!file.error}
                      />
                      <div className="file-info">
                        <div className="file-name">
                          <strong>{file.lang}</strong> - {file.relativePath}
                        </div>
                        {!file.error && file.keys && (
                          <div className="file-keys">{file.keys} keys found</div>
                        )}
                        {file.error && (
                          <div className="file-error">{file.error}</div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="selection-summary">
                {selectedFiles.size} of {foundFiles.filter(f => !f.error).length} files selected
              </div>
              
              <div className="wizard-actions">
                <button 
                  onClick={() => setCurrentStep(2)} 
                  className="btn btn-secondary"
                >
                  Back
                </button>
                <button 
                  onClick={handleLoadSelectedFiles} 
                  disabled={!canLoadFiles}
                  className="btn btn-primary btn-large"
                >
                  Load Selected Files
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;