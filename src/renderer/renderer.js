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

    // Initialize UI
    updateUIState();

    // Modal Event Listeners
    configBtn.addEventListener('click', openConfigModal);
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

    function updateUIState() {
        if (isProjectConfigured) {
            // Show configured state
            welcomeMessage.style.display = 'none';
            noProjectMessage.style.display = 'none';
            sidebarControls.style.display = 'block';
            sidebarTitle.textContent = 'Master Keys';
            masterLang.style.display = 'inline-block';
            keyTree.style.display = 'block';
        } else {
            // Show unconfigured state
            welcomeMessage.style.display = 'block';
            noProjectMessage.style.display = 'block';
            sidebarControls.style.display = 'none';
            sidebarTitle.textContent = 'i18n Swiss Knife';
            masterLang.style.display = 'none';
            keyTree.style.display = 'none';
            keyDetails.style.display = 'none';
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

    function saveTranslations() {
        // TODO: Implement save functionality
        console.log('Save translations functionality to be implemented');
    }
});