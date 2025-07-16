document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarTitle = document.getElementById('sidebarTitle');
    const masterLang = document.getElementById('masterLang');
    const keyTree = document.getElementById('keyTree');
    const keyDetails = document.getElementById('keyDetails');
    const selectedKeyPath = document.getElementById('selectedKeyPath');
    const translationEditor = document.getElementById('translationEditor');
    const noProjectMessage = document.getElementById('noProjectMessage');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const sidebarControls = document.getElementById('sidebarControls');
    const searchInput = document.getElementById('searchInput');
    const filterStats = document.getElementById('filterStats');
    
    // Modal Elements
    const configModal = document.getElementById('configModal');
    const configBtn = document.getElementById('configBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const startConfigBtn = document.getElementById('startConfigBtn');
    const welcomeConfigBtn = document.getElementById('welcomeConfigBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const applyConfigBtn = document.getElementById('applyConfigBtn');
    
    // Configuration Elements
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const pathDisplay = document.getElementById('pathDisplay');
    const patternSection = document.getElementById('patternSection');
    const patternInput = document.getElementById('patternInput');
    const loadFilesBtn = document.getElementById('loadFilesBtn');
    const translationFiles = document.getElementById('translationFiles');
    const filesList = document.getElementById('filesList');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectNoneBtn = document.getElementById('selectNoneBtn');
    const selectionCount = document.getElementById('selectionCount');
    
    // Context Menu and Add Item Modal Elements
    const contextMenu = document.getElementById('contextMenu');
    const addItemModal = document.getElementById('addItemModal');
    const addItemTitle = document.getElementById('addItemTitle');
    const itemName = document.getElementById('itemName');
    const itemHint = document.getElementById('itemHint');
    const translationInputs = document.getElementById('translationInputs');
    const translationFields = document.getElementById('translationFields');
    const closeAddItemModal = document.getElementById('closeAddItemModal');
    const cancelAddItem = document.getElementById('cancelAddItem');
    const confirmAddItem = document.getElementById('confirmAddItem');
    const addKey = document.getElementById('addKey');
    
    // Add Key Section Elements
    const addKeyInput = document.getElementById('addKeyInput');
    const addKeyBtn = document.getElementById('addKeyBtn');
    
    // Conflict Modal Elements
    const conflictModal = document.getElementById('conflictModal');
    const conflictMessage = document.getElementById('conflictMessage');
    const existingKeyDisplay = document.getElementById('existingKeyDisplay');
    const newKeyDisplay = document.getElementById('newKeyDisplay');
    const closeConflictModal = document.getElementById('closeConflictModal');
    const cancelConflict = document.getElementById('cancelConflict');
    const confirmConflict = document.getElementById('confirmConflict');
    
    // State
    let selectedFolderPath = null;
    let masterFile = null;
    let masterData = null;
    let translationFilesData = [];
    let selectedFiles = new Set(); // Track selected files
    let isProjectConfigured = false;
    let currentSearchTerm = '';
    let currentFilter = 'all';
    let allKeys = []; // Cache of all keys for filtering
    let contextMenuTarget = null; // Track which node the context menu was opened for
    let pendingKeyAddition = null; // Track pending key addition for conflict resolution

    // Initialize UI
    updateUIState();

    // Modal Event Listeners
    configBtn.addEventListener('click', openConfigModal);
    reloadBtn.addEventListener('click', reloadFiles);
    startConfigBtn.addEventListener('click', openConfigModal);
    welcomeConfigBtn.addEventListener('click', openConfigModal);
    closeModalBtn.addEventListener('click', closeConfigModal);
    applyConfigBtn.addEventListener('click', applyConfiguration);

    // Configuration Event Listeners
    selectFolderBtn.addEventListener('click', selectFolder);
    loadFilesBtn.addEventListener('click', loadFiles);
    selectAllBtn.addEventListener('click', selectAllFiles);
    selectNoneBtn.addEventListener('click', selectNoneFiles);
    patternInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadFilesBtn.click();
        }
    });

    // Search and Filter Event Listeners
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase();
        applyFilters();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');
            
            currentFilter = e.target.getAttribute('data-filter');
            applyFilters();
        });
    });

    // Modal overlay click to close
    configModal.addEventListener('click', (e) => {
        if (e.target === configModal) {
            closeConfigModal();
        }
    });
    
    // Add Item Modal Event Listeners
    closeAddItemModal.addEventListener('click', closeAddItemModalHandler);
    cancelAddItem.addEventListener('click', closeAddItemModalHandler);
    confirmAddItem.addEventListener('click', handleAddItem);
    addKey.addEventListener('click', () => openAddItemModal('key'));
    
    // Add Key Section Event Listeners
    addKeyBtn.addEventListener('click', handleArbitraryKeyAdd);
    addKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleArbitraryKeyAdd();
        }
    });
    
    // Conflict Modal Event Listeners
    closeConflictModal.addEventListener('click', closeConflictModalHandler);
    cancelConflict.addEventListener('click', closeConflictModalHandler);
    confirmConflict.addEventListener('click', handleConflictConfirm);
    
    // Add Item Modal overlay click to close
    addItemModal.addEventListener('click', (e) => {
        if (e.target === addItemModal) {
            closeAddItemModalHandler();
        }
    });
    
    // Conflict Modal overlay click to close
    conflictModal.addEventListener('click', (e) => {
        if (e.target === conflictModal) {
            closeConflictModalHandler();
        }
    });
    
    // Context menu hide on click outside
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    function updateUIState() {
        if (isProjectConfigured) {
            // Show configured state
            welcomeMessage.style.display = 'none';
            noProjectMessage.style.display = 'none';
            sidebarControls.style.display = 'block';
            sidebarTitle.textContent = 'Master Keys';
            masterLang.style.display = 'inline-block';
            keyTree.style.display = 'block';
            reloadBtn.style.display = 'flex';
        } else {
            // Show unconfigured state
            welcomeMessage.style.display = 'block';
            noProjectMessage.style.display = 'block';
            sidebarControls.style.display = 'none';
            sidebarTitle.textContent = 'i18n Swiss Knife';
            masterLang.style.display = 'none';
            keyTree.style.display = 'none';
            keyDetails.style.display = 'none';
            reloadBtn.style.display = 'none';
        }
    }

    function openConfigModal() {
        configModal.style.display = 'flex';
        resetConfigModal();
    }

    function closeConfigModal() {
        configModal.style.display = 'none';
    }

    function resetConfigModal() {
        // Reset all configuration steps
        patternSection.style.display = 'none';
        translationFiles.style.display = 'none';
        applyConfigBtn.style.display = 'none';
        
        // Reset displays
        if (!selectedFolderPath) {
            pathDisplay.textContent = 'No folder selected';
            pathDisplay.classList.remove('has-path', 'error');
        }
        
        // Reset selection state
        selectedFiles.clear();
        masterFile = null;
        masterData = null;
        
        filesList.innerHTML = '';
        updateSelectionCount();
    }

    async function selectFolder() {
        try {
            const folderPath = await window.electronAPI.selectFolder();
            
            if (folderPath) {
                selectedFolderPath = folderPath;
                pathDisplay.textContent = folderPath;
                pathDisplay.classList.remove('error');
                pathDisplay.classList.add('has-path');
                
                // Show pattern section
                patternSection.style.display = 'block';
                
                // Hide later sections
                translationFiles.style.display = 'none';
                applyConfigBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
            pathDisplay.textContent = 'Error selecting folder';
            pathDisplay.classList.add('error');
        }
    }

    async function loadFiles() {
        if (!selectedFolderPath) {
            alert('Please select a folder first');
            return;
        }

        const pattern = patternInput.value.trim();
        if (!pattern || !pattern.includes('{lang}')) {
            alert('Pattern must include {lang} placeholder');
            return;
        }

        // Show loading state
        translationFiles.style.display = 'block';
        filesList.innerHTML = '<div class="loading">Loading translation files...</div>';

        try {
            const files = await window.electronAPI.loadTranslationFiles(selectedFolderPath, pattern);
            translationFilesData = files;
            
            if (files.length === 0) {
                filesList.innerHTML = '<div class="no-files">No translation files found matching the pattern</div>';
                applyConfigBtn.style.display = 'none';
            } else {
                // Select all valid files by default
                selectedFiles.clear();
                files.filter(f => !f.error).forEach(file => selectedFiles.add(file.lang));
                
                renderFilesList(files);
                updateApplyButtonState();
            }
        } catch (error) {
            console.error('Error loading translation files:', error);
            filesList.innerHTML = '<div class="no-files">Error loading files: ' + error.message + '</div>';
            applyConfigBtn.style.display = 'none';
        }
    }

    function renderFilesList(files) {
        // Group files by whether they have errors
        const validFiles = files.filter(f => !f.error);
        const errorFiles = files.filter(f => f.error);
        
        let html = '';
        
        // Display valid files first
        validFiles.forEach(file => {
            const isMaster = masterFile && masterFile.lang === file.lang;
            const isSelected = selectedFiles.has(file.lang);
            html += `
                <div class="file-item ${isMaster ? 'is-master' : ''} ${isSelected ? 'selected' : ''}">
                    <div class="file-selection">
                        <input type="checkbox" class="file-checkbox" data-lang="${file.lang}" ${isSelected ? 'checked' : ''}>
                        <div class="file-info">
                            <div class="file-lang">${file.lang}</div>
                            <div class="file-path">${file.relativePath}</div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <div class="file-status">${file.keys} keys</div>
                        <button class="master-btn" data-lang="${file.lang}" ${isMaster ? 'disabled' : ''} ${!isSelected ? 'disabled' : ''}>
                            ${isMaster ? 'Master' : 'Set as Master'}
                        </button>
                    </div>
                </div>
            `;
        });
        
        // Display error files (not selectable)
        errorFiles.forEach(file => {
            html += `
                <div class="file-item">
                    <div class="file-selection">
                        <input type="checkbox" class="file-checkbox" disabled>
                        <div class="file-info">
                            <div class="file-lang">${file.lang}</div>
                            <div class="file-path">${file.relativePath}</div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <div class="file-status error">${file.error}</div>
                    </div>
                </div>
            `;
        });
        
        filesList.innerHTML = html;
        
        // Add event listeners for checkboxes
        filesList.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const lang = e.target.getAttribute('data-lang');
                if (lang) {
                    toggleFileSelection(lang, files);
                }
            });
        });
        
        // Add event listeners for master buttons
        filesList.querySelectorAll('.master-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                setMasterFile(lang, files);
            });
        });
        
        // Update selection count
        updateSelectionCount();
    }

    function toggleFileSelection(lang, files) {
        if (selectedFiles.has(lang)) {
            selectedFiles.delete(lang);
            // If this was the master file, clear it
            if (masterFile && masterFile.lang === lang) {
                masterFile = null;
                masterData = null;
            }
        } else {
            selectedFiles.add(lang);
        }
        
        // Update the files list to show the new selection
        renderFilesList(files);
        
        // Update apply button visibility
        updateApplyButtonState();
    }

    function selectAllFiles() {
        const validFiles = translationFilesData.filter(f => !f.error);
        selectedFiles.clear();
        validFiles.forEach(file => selectedFiles.add(file.lang));
        renderFilesList(translationFilesData);
        updateApplyButtonState();
    }

    function selectNoneFiles() {
        selectedFiles.clear();
        masterFile = null;
        masterData = null;
        renderFilesList(translationFilesData);
        updateApplyButtonState();
    }

    function updateSelectionCount() {
        const count = selectedFiles.size;
        selectionCount.textContent = `${count} file${count !== 1 ? 's' : ''} selected`;
    }

    function updateApplyButtonState() {
        const hasSelection = selectedFiles.size > 0;
        const hasMaster = masterFile && selectedFiles.has(masterFile.lang);
        applyConfigBtn.style.display = hasSelection && hasMaster ? 'inline-block' : 'none';
    }

    function setMasterFile(lang, files) {
        const file = files.find(f => f.lang === lang);
        if (!file || file.error || !selectedFiles.has(lang)) return;
        
        masterFile = file;
        masterData = file.content;
        
        // Update the files list to show the new master
        renderFilesList(files);
        
        // Update apply button
        updateApplyButtonState();
    }

    function applyConfiguration() {
        if (!masterFile || selectedFiles.size === 0) {
            alert('Please select files and a master file first');
            return;
        }
        
        // Filter translationFilesData to only include selected files
        translationFilesData = translationFilesData.filter(file => 
            selectedFiles.has(file.lang) && !file.error
        );
        
        // Update project state
        isProjectConfigured = true;
        
        // Update UI
        updateUIState();
        
        // Update sidebar
        masterLang.textContent = masterFile.lang;
        
        // Render the key tree
        renderKeyTree(masterFile.content);
        
        // Close modal
        closeConfigModal();
    }

    function renderKeyTree(data) {
        keyTree.innerHTML = '';
        
        // Cache all keys with their translation status
        allKeys = getAllKeysWithStatus(data);
        
        const treeHTML = createTreeNode('', data, true);
        keyTree.innerHTML = treeHTML;
        
        // Add event listeners for tree toggles
        keyTree.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const node = e.target.closest('.tree-node');
                const children = node.querySelector('.tree-children');
                const toggle = node.querySelector('.tree-toggle');
                
                if (children) {
                    children.classList.toggle('expanded');
                    toggle.classList.toggle('expanded');
                }
            });
        });
        
        // Add event listeners for tree node selection
        keyTree.querySelectorAll('.tree-node-content').forEach(content => {
            content.addEventListener('click', (e) => {
                // Remove previous selection
                keyTree.querySelectorAll('.tree-node-content').forEach(c => c.classList.remove('selected'));
                // Add selection to clicked node
                e.currentTarget.classList.add('selected');
                
                // Get the path to the selected node
                const node = e.currentTarget.closest('.tree-node');
                const keyPath = getNodePath(node);
                
                // Display the keys for the selected node
                displayKeysForPath(keyPath);
            });
            
            // Add right-click context menu
            content.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const node = e.currentTarget.closest('.tree-node');
                contextMenuTarget = node;
                
                // Position and show context menu
                contextMenu.style.left = e.clientX + 'px';
                contextMenu.style.top = e.clientY + 'px';
                contextMenu.style.display = 'block';
                
                // Adjust position if menu would go off screen
                const menuRect = contextMenu.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                if (menuRect.right > windowWidth) {
                    contextMenu.style.left = (e.clientX - menuRect.width) + 'px';
                }
                if (menuRect.bottom > windowHeight) {
                    contextMenu.style.top = (e.clientY - menuRect.height) + 'px';
                }
            });
        });
        
        // Initial filter application
        applyFilters();
    }

    function createTreeNode(key, value, isRoot = false, parentPath = '') {
        const isObject = typeof value === 'object' && value !== null;
        const nodeClass = isObject ? 'is-object' : 'is-leaf';
        const hasChildren = isObject && Object.keys(value).length > 0;
        const currentPath = isRoot ? '' : (parentPath ? `${parentPath}.${key}` : key);
        
        let html = `
            <div class="tree-node ${nodeClass}" data-key-path="${currentPath}">
                <div class="tree-node-content">
                    <div class="tree-toggle ${hasChildren ? '' : 'leaf'}">
                        ${hasChildren ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg>' : ''}
                    </div>
                    <div class="tree-icon">
                        ${isObject ? '📁' : '📄'}
                    </div>
                    <div class="tree-label">${isRoot ? 'Root' : key}</div>
                </div>
        `;
        
        if (hasChildren) {
            html += '<div class="tree-children">';
            Object.keys(value).forEach(childKey => {
                html += createTreeNode(childKey, value[childKey], false, currentPath);
            });
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    function getNodePath(node) {
        return node.getAttribute('data-key-path') || '';
    }

    function displayKeysForPath(keyPath) {
        if (!masterData) return;
        
        // Get the data at the specified path
        const data = getValueAtPath(masterData, keyPath);
        if (!data) return;
        
        // Show the key details panel
        keyDetails.style.display = 'block';
        
        // Update the path display
        selectedKeyPath.textContent = keyPath || 'Root';
        
        // Extract and display keys for editing
        const keys = extractKeysForEditing(data, keyPath);
        renderTranslationEditor(keys);
    }

    function getValueAtPath(obj, path) {
        if (!path) return obj;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return null;
            }
        }
        
        return current;
    }

    function extractKeysForEditing(data, basePath = '', limit = 50) {
        const keys = [];
        
        function traverse(obj, path) {
            if (keys.length >= limit) return;
            
            if (typeof obj === 'object' && obj !== null) {
                Object.keys(obj).forEach(key => {
                    if (keys.length >= limit) return;
                    
                    const currentPath = path ? `${path}.${key}` : key;
                    const value = obj[key];
                    
                    if (typeof value === 'string') {
                        // Only add string values for editing
                        keys.push({
                            key: currentPath,
                            value: value
                        });
                    } else if (typeof value === 'object' && value !== null) {
                        // Traverse nested objects
                        traverse(value, currentPath);
                    }
                });
            } else if (typeof obj === 'string') {
                // Single string value
                keys.push({
                    key: basePath || 'value',
                    value: obj
                });
            }
        }
        
        traverse(data, basePath);
        return keys;
    }

    function renderTranslationEditor(keys) {
        if (keys.length === 0) {
            translationEditor.innerHTML = '<div class="no-selection"><h3>No translatable keys found</h3><p>Select a node that contains string values to edit translations.</p></div>';
            return;
        }
        
        let html = '';
        keys.forEach(keyData => {
            const translations = getTranslationsForKey(keyData.key);
            const hasWarnings = translations.some(t => t.warning);
            const hasErrors = translations.some(t => t.error);
            
            let statusClass = 'status-complete';
            let statusText = 'Complete';
            
            if (hasErrors) {
                statusClass = 'status-error';
                statusText = 'Missing translations';
            } else if (hasWarnings) {
                statusClass = 'status-warning';
                statusText = 'Has warnings';
            }
            
            html += `
                <div class="translation-key ${hasWarnings ? 'has-warnings' : ''} ${hasErrors ? 'has-errors' : ''}">
                    <div class="key-header">
                        <div class="key-name">${keyData.key}</div>
                        <div class="key-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="language-inputs">
                        ${translations.map(t => `
                            <div class="language-input ${t.warning ? 'has-warning' : ''}">
                                <div class="language-label">
                                    <span class="warning-indicator"></span>
                                    ${t.lang}
                                </div>
                                <textarea 
                                    class="translation-input ${t.error ? 'is-missing' : ''} ${t.warning ? 'has-warning' : ''}"
                                    placeholder="${t.error ? 'Missing translation' : 'Enter translation...'}"
                                    data-key="${keyData.key}"
                                    data-lang="${t.lang}"
                                    rows="1"
                                >${t.value || ''}</textarea>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        // Add footer with save button
        html += `
            <div class="editor-footer">
                <div class="translation-count">
                    ${keys.length} ${keys.length === 1 ? 'key' : 'keys'} selected
                </div>
                <button class="save-btn" id="saveTranslations">Save Changes</button>
            </div>
        `;
        
        translationEditor.innerHTML = html;
        
        // Add auto-resize functionality to textareas
        translationEditor.querySelectorAll('.translation-input').forEach(textarea => {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
            
            // Initial resize
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
        
        // Add save button functionality
        const saveBtn = document.getElementById('saveTranslations');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveTranslations);
        }
    }

    function getTranslationsForKey(key) {
        const translations = [];
        
        translationFilesData.forEach(file => {
            if (file.error) return;
            
            const value = getValueAtPath(file.content, key);
            const translation = {
                lang: file.lang,
                value: value || '',
                error: !value,
                warning: false
            };
            
            // Check for warnings (empty string, etc.)
            if (value === '') {
                translation.warning = true;
            }
            
            translations.push(translation);
        });
        
        return translations;
    }

    async function saveTranslations() {
        const saveBtn = document.getElementById('saveTranslations');
        if (!saveBtn) return;
        
        // Disable save button and show loading state
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        try {
            // Collect all changes from the translation inputs
            const changes = [];
            const inputs = translationEditor.querySelectorAll('.translation-input');
            
            inputs.forEach(input => {
                const keyPath = input.getAttribute('data-key');
                const lang = input.getAttribute('data-lang');
                const value = input.value.trim();
                
                if (keyPath && lang) {
                    // Find the corresponding file
                    const file = translationFilesData.find(f => f.lang === lang);
                    if (file) {
                        changes.push({
                            filePath: file.path,
                            keyPath: keyPath,
                            value: value
                        });
                    }
                }
            });
            
            if (changes.length === 0) {
                showSaveResult('No changes to save', 'info');
                return;
            }
            
            // Save the changes
            const results = await window.electronAPI.saveTranslationFiles(changes);
            
            // Update the in-memory data structures
            updateTranslationData(changes);
            
            // Show results
            const errors = results.filter(r => r.status === 'error');
            if (errors.length > 0) {
                showSaveResult(`Save completed with ${errors.length} error(s)`, 'warning');
                console.error('Save errors:', errors);
            } else {
                showSaveResult('All changes saved successfully', 'success');
            }
            
            // Refresh the tree and filters to reflect changes
            allKeys = getAllKeysWithStatus(masterData);
            applyFilters();
            
            // Refresh the current editor view if something is selected
            const selectedNode = keyTree.querySelector('.tree-node-content.selected');
            if (selectedNode) {
                const keyPath = selectedNode.closest('.tree-node').getAttribute('data-key-path');
                refreshCurrentEditorView(keyPath);
            }
            
        } catch (error) {
            console.error('Save error:', error);
            showSaveResult('Failed to save changes', 'error');
        } finally {
            // Re-enable save button
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    }

    function updateTranslationData(changes) {
        // Update the in-memory translation data
        changes.forEach(change => {
            const { keyPath, value } = change;
            const file = translationFilesData.find(f => f.path === change.filePath);
            
            if (file && file.content) {
                setValueAtPath(file.content, keyPath, value);
            }
        });
    }

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

    function refreshCurrentEditorView(keyPath) {
        // Get the data at the specified path
        const data = getValueAtPath(masterData, keyPath);
        if (!data) return;
        
        // Extract keys for the current selection
        const keys = extractKeysForEditing(data, keyPath);
        
        // Update only the status indicators and styling for each key
        keys.forEach(keyData => {
            const translationKey = document.querySelector(`[data-key="${keyData.key}"]`)?.closest('.translation-key');
            if (translationKey) {
                updateTranslationKeyStatus(translationKey, keyData.key);
            }
        });
    }

    function updateTranslationKeyStatus(translationKeyElement, keyPath) {
        const translations = getTranslationsForKey(keyPath);
        const hasWarnings = translations.some(t => t.warning);
        const hasErrors = translations.some(t => t.error);
        
        // Update the main container classes
        translationKeyElement.classList.remove('has-warnings', 'has-errors');
        if (hasWarnings) {
            translationKeyElement.classList.add('has-warnings');
        }
        if (hasErrors) {
            translationKeyElement.classList.add('has-errors');
        }
        
        // Update the status text
        const statusElement = translationKeyElement.querySelector('.key-status');
        if (statusElement) {
            let statusClass = 'status-complete';
            let statusText = 'Complete';
            
            if (hasErrors) {
                statusClass = 'status-error';
                statusText = 'Missing translations';
            } else if (hasWarnings) {
                statusClass = 'status-warning';
                statusText = 'Has warnings';
            }
            
            statusElement.className = `key-status ${statusClass}`;
            statusElement.textContent = statusText;
        }
        
        // Update individual input styling
        translations.forEach(translation => {
            const input = translationKeyElement.querySelector(`[data-lang="${translation.lang}"]`);
            const inputContainer = input?.closest('.language-input');
            
            if (input && inputContainer) {
                // Update input classes
                input.classList.remove('is-missing', 'has-warning');
                inputContainer.classList.remove('has-warning');
                
                if (translation.error) {
                    input.classList.add('is-missing');
                    input.placeholder = 'Missing translation';
                } else if (translation.warning) {
                    input.classList.add('has-warning');
                    inputContainer.classList.add('has-warning');
                } else {
                    input.placeholder = 'Enter translation...';
                }
            }
        });
    }

    function showSaveResult(message, type) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = `save-notification ${type}`;
        notification.textContent = message;
        
        // Add to the editor
        const editorFooter = document.querySelector('.editor-footer');
        if (editorFooter) {
            editorFooter.appendChild(notification);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }

    function getAllKeysWithStatus(data, basePath = '') {
        const keys = [];
        
        function traverse(obj, path) {
            if (typeof obj === 'object' && obj !== null) {
                Object.keys(obj).forEach(key => {
                    const currentPath = path ? `${path}.${key}` : key;
                    const value = obj[key];
                    
                    if (typeof value === 'string') {
                        // Check translation status across all languages
                        const translations = getTranslationsForKey(currentPath);
                        const missing = translations.filter(t => t.error).length;
                        const incomplete = translations.filter(t => t.warning).length;
                        
                        keys.push({
                            key: currentPath,
                            value: value,
                            missing: missing,
                            incomplete: incomplete,
                            total: translations.length
                        });
                    } else if (typeof value === 'object' && value !== null) {
                        traverse(value, currentPath);
                    }
                });
            }
        }
        
        traverse(data, basePath);
        return keys;
    }

    function applyFilters() {
        if (!isProjectConfigured) return;
        
        const nodes = keyTree.querySelectorAll('.tree-node');
        let visibleLeafCount = 0;
        
        // First pass: determine which leaf nodes should be visible
        const visibleNodes = new Set();
        
        nodes.forEach(node => {
            const keyPath = node.getAttribute('data-key-path');
            const isLeaf = node.classList.contains('is-leaf');
            
            if (isLeaf) {
                const shouldShow = shouldShowLeafNode(keyPath);
                if (shouldShow) {
                    visibleNodes.add(node);
                    visibleLeafCount++;
                    
                    // Mark all parent nodes as needed
                    let parent = node.parentElement;
                    while (parent && parent.classList.contains('tree-children')) {
                        const parentNode = parent.parentElement;
                        if (parentNode && parentNode.classList.contains('tree-node')) {
                            visibleNodes.add(parentNode);
                        }
                        parent = parentNode?.parentElement;
                    }
                }
            }
        });
        
        // Second pass: show/hide nodes based on visibility set
        nodes.forEach(node => {
            const keyPath = node.getAttribute('data-key-path');
            const isVisible = visibleNodes.has(node);
            
            if (isVisible) {
                node.classList.remove('hidden');
                
                // Highlight search matches
                if (currentSearchTerm && keyPath && keyPath.toLowerCase().includes(currentSearchTerm)) {
                    node.classList.add('highlighted');
                } else {
                    node.classList.remove('highlighted');
                }
                
                // Add status indicators
                updateNodeStatusIndicators(node, keyPath);
            } else {
                node.classList.add('hidden');
                node.classList.remove('highlighted');
            }
        });
        
        // Update stats
        updateFilterStats(visibleLeafCount);
    }

    function shouldShowLeafNode(keyPath) {
        // Skip empty paths
        if (!keyPath) return false;
        
        // Search filter
        if (currentSearchTerm && !keyPath.toLowerCase().includes(currentSearchTerm)) {
            return false;
        }
        
        // Translation status filter
        if (currentFilter !== 'all') {
            const keyData = allKeys.find(k => k.key === keyPath);
            if (!keyData) return false; // Don't show if no key data
            
            switch (currentFilter) {
                case 'missing':
                    return keyData.missing > 0;
                case 'incomplete':
                    return keyData.incomplete > 0;
                case 'complete':
                    return keyData.missing === 0 && keyData.incomplete === 0;
                default:
                    return true;
            }
        }
        
        return true;
    }

    function updateNodeStatusIndicators(node, keyPath) {
        const keyData = allKeys.find(k => k.key === keyPath);
        if (!keyData) return;
        
        // Remove existing status classes
        node.classList.remove('has-missing', 'has-incomplete');
        
        // Add appropriate status class
        if (keyData.missing > 0) {
            node.classList.add('has-missing');
        } else if (keyData.incomplete > 0) {
            node.classList.add('has-incomplete');
        }
    }

    function updateFilterStats(visibleCount) {
        let totalCount = 0;
        let filteredCount = 0;
        
        switch (currentFilter) {
            case 'missing':
                totalCount = allKeys.filter(k => k.missing > 0).length;
                filteredCount = visibleCount;
                break;
            case 'incomplete':
                totalCount = allKeys.filter(k => k.incomplete > 0).length;
                filteredCount = visibleCount;
                break;
            case 'complete':
                totalCount = allKeys.filter(k => k.missing === 0 && k.incomplete === 0).length;
                filteredCount = visibleCount;
                break;
            default:
                totalCount = allKeys.length;
                filteredCount = visibleCount;
        }
        
        const text = currentSearchTerm ? 
            `${filteredCount} of ${totalCount} keys` : 
            `${totalCount} keys`;
        
        filterStats.textContent = text;
    }
    
    function openAddItemModal(type) {
        contextMenu.style.display = 'none';
        
        addItemTitle.textContent = 'Add New Translation Key';
        translationInputs.style.display = 'block';
        
        // Create translation input fields for all languages
        let fieldsHTML = '';
        translationFilesData.forEach(file => {
            if (!file.error) {
                fieldsHTML += `
                    <div class="translation-field">
                        <label>${file.lang}:</label>
                        <input type="text" data-lang="${file.lang}" placeholder="Enter translation...">
                    </div>
                `;
            }
        });
        translationFields.innerHTML = fieldsHTML;
        
        // Clear the input field
        itemName.value = '';
        
        // Show modal
        addItemModal.style.display = 'flex';
        
        // Focus on name input
        setTimeout(() => itemName.focus(), 100);
    }
    
    function closeAddItemModalHandler() {
        addItemModal.style.display = 'none';
        contextMenuTarget = null;
        itemName.value = '';
        translationFields.innerHTML = '';
    }
    
    function handleAddItem() {
        const name = itemName.value.trim();
        
        if (!name) {
            alert('Please enter a key name');
            return;
        }
        
        // Allow adding to root when contextMenuTarget is null
        const targetKeyPath = contextMenuTarget ? getNodePath(contextMenuTarget) : '';
        const translations = {};
        
        // Collect translation values
        translationFields.querySelectorAll('input').forEach(input => {
            const lang = input.getAttribute('data-lang');
            const value = input.value.trim();
            if (value) {
                translations[lang] = value;
            }
        });
        
        addTranslationKey(targetKeyPath, name, translations);
        closeAddItemModalHandler();
    }
    
    function addTranslationKey(parentPath, keyName, translations) {
        // Handle dot notation in keyName to create nested structure
        const fullKeyName = parentPath ? `${parentPath}.${keyName}` : keyName;
        
        // Add key to master data (use master language or first available translation)
        const masterLang = masterFile.lang;
        const masterValue = translations[masterLang] || Object.values(translations)[0] || '';
        setValueAtPath(masterData, fullKeyName, masterValue);
        
        // Add translations to all files
        translationFilesData.forEach(file => {
            if (!file.error) {
                const value = translations[file.lang] || '';
                setValueAtPath(file.content, fullKeyName, value);
            }
        });
        
        // Update UI
        renderKeyTree(masterData);
        
        // Save changes to all files
        saveNewStructure();
        
        // Focus the newly added key in the tree and main view
        focusKeyInTree(fullKeyName);
    }
    
    async function saveNewStructure() {
        try {
            // Prepare changes for all files
            const allChanges = [];
            
            translationFilesData.forEach(file => {
                if (!file.error) {
                    // For new structure, we need to save the entire file
                    // We'll create a special change that represents the entire file content
                    allChanges.push({
                        filePath: file.path,
                        keyPath: '', // Empty path means replace entire file
                        value: file.content
                    });
                }
            });
            
            // Save all changes
            await window.electronAPI.saveTranslationFiles(allChanges);
            
            // Update the cache
            allKeys = getAllKeysWithStatus(masterData);
            applyFilters();
            
        } catch (error) {
            console.error('Error saving new structure:', error);
            alert('Failed to save changes');
        }
    }
    
    async function reloadFiles() {
        if (!isProjectConfigured || !selectedFolderPath) {
            alert('No project configured to reload');
            return;
        }
        
        // Show loading state
        reloadBtn.disabled = true;
        reloadBtn.style.opacity = '0.6';
        
        // Store current configuration
        const currentPattern = patternInput.value;
        const currentSelectedFiles = new Set(selectedFiles);
        const currentMasterLang = masterFile ? masterFile.lang : null;
        
        try {
            // Reload files using the same pattern
            const files = await window.electronAPI.loadTranslationFiles(selectedFolderPath, currentPattern);
            
            if (files.length === 0) {
                alert('No translation files found. Files may have been moved or deleted.');
                return;
            }
            
            // Update translation files data
            translationFilesData = files.filter(file => 
                currentSelectedFiles.has(file.lang) && !file.error
            );
            
            // Find and set master file
            const newMasterFile = translationFilesData.find(f => f.lang === currentMasterLang);
            if (newMasterFile) {
                masterFile = newMasterFile;
                masterData = newMasterFile.content;
            } else {
                // If master file not found, use first available
                masterFile = translationFilesData[0];
                masterData = masterFile.content;
            }
            
            // Update UI
            masterLang.textContent = masterFile.lang;
            renderKeyTree(masterData);
            
            // Clear key details if something was selected
            keyDetails.style.display = 'none';
            
            // Show success message
            showReloadResult('Files reloaded successfully', 'success');
            
        } catch (error) {
            console.error('Error reloading files:', error);
            showReloadResult('Failed to reload files', 'error');
        } finally {
            // Re-enable reload button
            reloadBtn.disabled = false;
            reloadBtn.style.opacity = '1';
        }
    }
    
    function showReloadResult(message, type) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = `reload-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 1000;
            animation: slideInFromTop 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.background = '#d4edda';
            notification.style.color = '#155724';
            notification.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            notification.style.background = '#f8d7da';
            notification.style.color = '#721c24';
            notification.style.border = '1px solid #f5c6cb';
        }
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    function handleArbitraryKeyAdd() {
        const keyName = addKeyInput.value.trim();
        
        if (!keyName) {
            alert('Please enter a key name');
            return;
        }
        
        if (!isProjectConfigured) {
            alert('No project configured');
            return;
        }
        
        // Check for conflicts
        const conflicts = detectKeyConflicts(keyName);
        
        if (conflicts.length > 0) {
            showConflictWarning(keyName, conflicts);
        } else {
            // No conflicts, proceed with adding the key
            proceedWithKeyAddition(keyName);
        }
    }
    
    function detectKeyConflicts(newKeyPath) {
        const conflicts = [];
        const keys = newKeyPath.split('.');
        
        // Check if adding this key would overwrite existing string values
        for (let i = 1; i <= keys.length; i++) {
            const partialPath = keys.slice(0, i).join('.');
            const existingValue = getValueAtPath(masterData, partialPath);
            
            if (existingValue !== null && typeof existingValue === 'string' && i < keys.length) {
                // This path exists as a string but we're trying to make it an object
                conflicts.push({
                    type: 'string-to-object',
                    path: partialPath,
                    existingValue: existingValue
                });
            }
        }
        
        // Check if the exact key already exists
        const existingValue = getValueAtPath(masterData, newKeyPath);
        if (existingValue !== null) {
            conflicts.push({
                type: 'key-exists',
                path: newKeyPath,
                existingValue: existingValue
            });
        }
        
        return conflicts;
    }
    
    function showConflictWarning(keyName, conflicts) {
        pendingKeyAddition = keyName;
        
        // Determine the primary conflict and message
        const primaryConflict = conflicts[0];
        let message = '';
        let existingDisplay = '';
        
        if (primaryConflict.type === 'string-to-object') {
            message = `Adding "${keyName}" will convert the existing string value at "${primaryConflict.path}" into an object, removing its current value.`;
            existingDisplay = `${primaryConflict.path} = "${primaryConflict.existingValue}"`;
        } else if (primaryConflict.type === 'key-exists') {
            message = `The key "${keyName}" already exists and will be overwritten.`;
            if (typeof primaryConflict.existingValue === 'string') {
                existingDisplay = `${primaryConflict.path} = "${primaryConflict.existingValue}"`;
            } else {
                existingDisplay = `${primaryConflict.path} = [object with ${Object.keys(primaryConflict.existingValue).length} keys]`;
            }
        }
        
        // Update modal content
        conflictMessage.textContent = message;
        existingKeyDisplay.textContent = existingDisplay;
        existingKeyDisplay.className = 'key-display existing';
        newKeyDisplay.textContent = `${keyName} = [new translation key]`;
        newKeyDisplay.className = 'key-display new';
        
        // Show modal
        conflictModal.style.display = 'flex';
    }
    
    function closeConflictModalHandler() {
        conflictModal.style.display = 'none';
        pendingKeyAddition = null;
    }
    
    function handleConflictConfirm() {
        if (pendingKeyAddition) {
            proceedWithKeyAddition(pendingKeyAddition);
            closeConflictModalHandler();
        }
    }
    
    function proceedWithKeyAddition(keyName) {
        // Open the add item modal with the key pre-filled
        contextMenuTarget = null; // No specific target, adding to root
        openAddItemModal('key');
        
        // Pre-fill the key name
        itemName.value = keyName;
        
        // Clear the arbitrary key input
        addKeyInput.value = '';
        
        // Focus on the first translation input
        const firstInput = translationFields.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
});