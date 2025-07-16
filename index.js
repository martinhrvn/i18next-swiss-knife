const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { glob } = require('glob');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // In development, load from vite dev server
  // In production, load from built files
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select a folder'
  });

  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.handle('load-translation-files', async (event, folderPath, pattern) => {
  try {
    // Replace {lang} with * to create a glob pattern
    const globPattern = pattern.replace('{lang}', '*');
    // Normalize path separators for glob (always use forward slashes)
    const fullPattern = path.join(folderPath, globPattern).replace(/\\/g, '/');
    
    // Use glob with promise API
    const files = await glob(fullPattern);
    
    const translationFiles = [];
    
    for (const filePath of files) {
      try {
        // Extract language code from file path
        const relativePath = path.relative(folderPath, filePath);
        // Create a simple regex by replacing {lang} with a capture group
        const patternRegex = pattern.replace('{lang}', '([^/\\\\]+)');
        const langMatch = relativePath.match(new RegExp(patternRegex));
        
        
        if (langMatch && langMatch[1]) {
          const content = await fs.readFile(filePath, 'utf8');
          let jsonContent;
          
          try {
            jsonContent = JSON.parse(content);
          } catch (parseError) {
            translationFiles.push({
              lang: langMatch[1],
              path: filePath,
              relativePath: relativePath,
              error: 'Invalid JSON format'
            });
            continue;
          }
          
          translationFiles.push({
            lang: langMatch[1],
            path: filePath,
            relativePath: relativePath,
            content: jsonContent,
            keys: Object.keys(jsonContent).length
          });
        }
      } catch (readError) {
        console.error(`Error reading file ${filePath}:`, readError);
      }
    }
    
    return translationFiles;
  } catch (error) {
    console.error('Error loading translation files:', error);
    throw error;
  }
});

ipcMain.handle('save-translation-files', async (event, changes) => {
  try {
    const results = [];
    
    // Group changes by file path
    const fileChanges = {};
    
    for (const change of changes) {
      const { filePath, keyPath, value } = change;
      
      if (!fileChanges[filePath]) {
        fileChanges[filePath] = [];
      }
      
      fileChanges[filePath].push({ keyPath, value });
    }
    
    // Process each file
    for (const [filePath, keyChanges] of Object.entries(fileChanges)) {
      try {
        // Read current file content
        const currentContent = await fs.readFile(filePath, 'utf8');
        let jsonData = JSON.parse(currentContent);
        
        // Apply changes
        for (const { keyPath, value } of keyChanges) {
          if (keyPath === '') {
            // Special case: replace entire file content
            jsonData = value;
          } else {
            setValueAtPath(jsonData, keyPath, value);
          }
        }
        
        // Write back to file with proper formatting
        const updatedContent = JSON.stringify(jsonData, null, 2);
        await fs.writeFile(filePath, updatedContent, 'utf8');
        
        results.push({ filePath, status: 'success' });
      } catch (error) {
        console.error(`Error saving file ${filePath}:`, error);
        results.push({ filePath, status: 'error', error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error saving translation files:', error);
    throw error;
  }
});

function setValueAtPath(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  // Navigate to the parent object
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  // Set the final value
  const finalKey = keys[keys.length - 1];
  if (value === '' || value === null || value === undefined) {
    // Remove empty values
    delete current[finalKey];
  } else {
    current[finalKey] = value;
  }
}