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

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

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