// File Management Module

let currentPath = '/';
let selectedFiles = [];
let viewMode = 'grid'; // 'grid' or 'list'
let sortBy = 'name';
let sortOrder = 'asc';

async function renderFiles(container) {
    container.innerHTML = `
        <!-- Toolbar -->
        <div class="toolbar flex-wrap">
            <div class="flex items-center gap-2">
                <button class="btn btn-primary btn-sm" id="upload-btn">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    Upload
                </button>
                <button class="btn btn-secondary btn-sm" id="new-folder-btn">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                    </svg>
                    New Folder
                </button>
            </div>

            <div class="toolbar-divider hidden sm:block"></div>

            <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-sm ${selectedFiles.length === 0 ? 'opacity-50' : ''}" id="delete-selected-btn" ${selectedFiles.length === 0 ? 'disabled' : ''}>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete
                </button>
            </div>

            <div class="flex-1"></div>

            <div class="flex items-center gap-2">
                <div class="search-container" style="width: 200px;">
                    <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input type="text" class="search-input" placeholder="Search files..." id="file-search">
                </div>

                <div class="pill-tabs">
                    <div class="pill-tab ${viewMode === 'grid' ? 'active' : ''}" data-view="grid">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                        </svg>
                    </div>
                    <div class="pill-tab ${viewMode === 'list' ? 'active' : ''}" data-view="list">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Breadcrumb -->
        <div class="breadcrumb mb-4" id="breadcrumb">
            <span class="breadcrumb-item active" data-path="/">Root</span>
        </div>

        <!-- Storage Info -->
        <div class="card mb-6">
            <div class="card-body py-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                        </svg>
                        <span class="text-sm font-medium">Storage</span>
                    </div>
                    <span class="text-sm text-gray-500" id="storage-info">0 bytes of 8 GB used</span>
                </div>
                <div class="storage-bar" style="height: 6px;">
                    <div class="storage-bar-fill" id="files-storage-bar" style="width: 0%"></div>
                </div>
            </div>
        </div>

        <!-- Drop Zone -->
        <div class="dropzone mb-6" id="dropzone">
            <svg class="dropzone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p class="dropzone-text">Drag and drop files here, or click to browse</p>
            <p class="dropzone-hint">Upload any file type or size</p>
            <input type="file" id="file-input" multiple style="display: none;">
        </div>

        <!-- Files Container -->
        <div id="files-container">
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                </svg>
                <h3 class="empty-state-title">No files yet</h3>
                <p class="empty-state-description">Upload your first file to get started</p>
            </div>
        </div>
    `;

    // Setup event handlers
    setupFileHandlers();

    // Load files
    await loadFiles();

    // Update storage info
    updateStorageInfo();
}

function setupFileHandlers() {
    // Upload button
    document.getElementById('upload-btn').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });

    // File input change
    document.getElementById('file-input').addEventListener('change', handleFileSelect);

    // New folder button
    document.getElementById('new-folder-btn').addEventListener('click', createNewFolder);

    // Delete selected button
    document.getElementById('delete-selected-btn').addEventListener('click', deleteSelectedFiles);

    // View mode toggle
    document.querySelectorAll('.pill-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            viewMode = tab.dataset.view;
            document.querySelectorAll('.pill-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderFilesList();
        });
    });

    // Search
    document.getElementById('file-search').addEventListener('input', utils.debounce((e) => {
        loadFiles(e.target.value);
    }, 300));

    // Drag and drop
    const dropzone = document.getElementById('dropzone');

    dropzone.addEventListener('click', () => {
        document.getElementById('file-input').click();
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFiles(files);
        }
    });
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        uploadFiles(files);
    }
    e.target.value = ''; // Reset input
}

async function uploadFiles(files) {
    let successCount = 0;
    let errorCount = 0;

    utils.showLoading(true);

    for (const file of files) {
        try {
            // Upload to MongoDB GridFS via API
            const result = await api.uploadFile(file);
            successCount++;
        } catch (error) {
            console.error('Upload error:', error);
            errorCount++;
        }
    }

    utils.showLoading(false);

    if (successCount > 0) {
        utils.showToast(`${successCount} file(s) uploaded successfully`, 'success');
        await loadFiles();
        updateStorageInfo();
    }
    if (errorCount > 0) {
        utils.showToast(`${errorCount} file(s) failed to upload`, 'error');
    }
}

async function loadFiles(searchQuery = '') {
    try {
        // Get files from MongoDB API
        const response = await fetch(`http://localhost:5000/api/files/list`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jt_auth_token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load files');

        const data = await response.json();
        let files = data.files || [];

        // Filter by search query if provided
        if (searchQuery) {
            files = files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Map to expected format
        window.currentFiles = files.map(f => ({
            id: f._id,
            name: f.filename,
            size: f.length,
            mime_type: f.contentType,
            created_at: f.uploadDate,
            storage_path: f._id
        }));

        renderFilesList();
    } catch (error) {
        console.error('Load files error:', error);
        window.currentFiles = [];
        renderFilesList();
    }
}

function renderFilesList() {
    const container = document.getElementById('files-container');
    const files = window.currentFiles || [];

    if (files.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                </svg>
                <h3 class="empty-state-title">No files yet</h3>
                <p class="empty-state-description">Upload your first file to get started</p>
            </div>
        `;
        return;
    }

    if (viewMode === 'grid') {
        container.innerHTML = `
            <div class="file-grid">
                ${files.map(file => `
                    <div class="file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}"
                         data-file-id="${file.id}"
                         oncontextmenu="showFileContextMenu(event, '${file.id}')">
                        <div class="file-icon">
                            ${utils.getFileIcon(file.mime_type)}
                        </div>
                        <div class="file-name" title="${utils.escapeHtml(file.name)}">${utils.escapeHtml(file.name)}</div>
                        <div class="file-meta">${utils.formatBytes(file.size)}</div>
                        <div class="sync-status">
                            <span class="sync-dot ${file.sync_status || 'synced'}"></span>
                            <span>${file.sync_status || 'synced'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="card">
                <div class="card-body p-0">
                    ${files.map(file => `
                        <div class="file-list-item ${selectedFiles.includes(file.id) ? 'selected' : ''}"
                             data-file-id="${file.id}"
                             oncontextmenu="showFileContextMenu(event, '${file.id}')">
                            <div class="file-list-icon">
                                ${utils.getFileIcon(file.mime_type)}
                            </div>
                            <div class="file-list-info">
                                <div class="file-list-name">${utils.escapeHtml(file.name)}</div>
                                <div class="file-list-details">
                                    ${utils.formatBytes(file.size)} - ${utils.formatDateShort(file.created_at)}
                                </div>
                            </div>
                            <div class="sync-status">
                                <span class="sync-dot ${file.sync_status || 'synced'}"></span>
                            </div>
                            <div class="flex items-center gap-2">
                                <button class="btn btn-ghost btn-icon btn-sm" onclick="downloadFile('${file.id}')">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                </button>
                                <button class="btn btn-ghost btn-icon btn-sm" onclick="showFileContextMenu(event, '${file.id}')">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Add click handlers for selection
    container.querySelectorAll('[data-file-id]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const fileId = el.dataset.fileId;
            toggleFileSelection(fileId);
        });

        el.addEventListener('dblclick', (e) => {
            const fileId = el.dataset.fileId;
            downloadFile(fileId);
        });
    });
}

function toggleFileSelection(fileId) {
    const index = selectedFiles.indexOf(fileId);
    if (index === -1) {
        selectedFiles.push(fileId);
    } else {
        selectedFiles.splice(index, 1);
    }
    renderFilesList();
    updateDeleteButton();
}

function updateDeleteButton() {
    const btn = document.getElementById('delete-selected-btn');
    if (btn) {
        btn.disabled = selectedFiles.length === 0;
        btn.classList.toggle('opacity-50', selectedFiles.length === 0);
    }
}

async function createNewFolder() {
    const name = await utils.promptDialog('Enter folder name:', 'New Folder', 'Create Folder');
    if (!name) return;

    // Note: Supabase Storage doesn't have real folders, but we can simulate them
    // by using paths in the file names. For this demo, we'll just show a message.
    utils.showToast('Folder created! (Folders are virtual in this system)', 'info');
}

async function deleteSelectedFiles() {
    if (selectedFiles.length === 0) return;

    const confirmed = await utils.confirmDialog(
        `Are you sure you want to delete ${selectedFiles.length} file(s)?`,
        'Delete Files'
    );

    if (!confirmed) return;

    utils.showLoading(true);
    let deletedCount = 0;

    for (const fileId of selectedFiles) {
        try {
            await deleteFile(fileId);
            deletedCount++;
        } catch (error) {
            console.error('Delete error:', error);
        }
    }

    utils.showLoading(false);
    selectedFiles = [];

    if (deletedCount > 0) {
        utils.showToast(`${deletedCount} file(s) deleted`, 'success');
        await loadFiles();
        updateStorageInfo();
    }
}

async function deleteFile(fileId) {
    const file = window.currentFiles?.find(f => f.id === fileId);
    if (!file) return;

    // Delete from MongoDB GridFS via API
    await api.deleteFile(fileId);
}

async function downloadFile(fileId) {
    const file = window.currentFiles?.find(f => f.id === fileId);
    if (!file) return;

    try {
        // Download from MongoDB GridFS via API
        const url = api.getFileUrl(fileId);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        utils.showToast('Download started', 'success');
    } catch (error) {
        console.error('Download error:', error);
        utils.showToast('Failed to download file', 'error');
    }
}

async function renameFile(fileId) {
    const file = window.currentFiles?.find(f => f.id === fileId);
    if (!file) return;

    const newName = await utils.promptDialog('Enter new name:', file.name, 'Rename File');
    if (!newName || newName === file.name) return;

    // Rename not implemented in GridFS API yet
    utils.showToast('Rename feature coming soon!', 'info');
}

function showFileContextMenu(event, fileId) {
    event.preventDefault();
    event.stopPropagation();

    // Remove existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" onclick="downloadFile('${fileId}')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download
        </div>
        <div class="context-menu-item" onclick="renameFile('${fileId}')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Rename
        </div>
        <div class="context-menu-item" onclick="copyFileLink('${fileId}')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Copy link
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item danger" onclick="confirmDeleteFile('${fileId}')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
        </div>
    `;

    // Position menu
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    document.body.appendChild(menu);

    // Adjust position if off screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = `${event.clientX - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = `${event.clientY - rect.height}px`;
    }

    // Close on click outside
    const closeMenu = () => {
        menu.remove();
        document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

async function copyFileLink(fileId) {
    const file = window.currentFiles?.find(f => f.id === fileId);
    if (!file) return;

    try {
        const url = api.getFileUrl(fileId);
        await utils.copyToClipboard(url);
    } catch (error) {
        console.error('Copy link error:', error);
        utils.showToast('Failed to copy link', 'error');
    }
}

async function confirmDeleteFile(fileId) {
    const file = window.currentFiles?.find(f => f.id === fileId);
    if (!file) return;

    const confirmed = await utils.confirmDialog(
        `Are you sure you want to delete "${file.name}"?`,
        'Delete File'
    );

    if (confirmed) {
        utils.showLoading(true);
        try {
            await deleteFile(fileId);
            utils.showToast('File deleted', 'success');
            await loadFiles();
            updateStorageInfo();
        } catch (error) {
            utils.showToast('Failed to delete file', 'error');
        }
        utils.showLoading(false);
    }
}

async function updateStorageInfo() {
    try {
        const stats = await api.getStorageStats();
        const used = stats.totalSize || 0;
        const limit = 8589934592; // 8GB
        const percentage = Math.min(100, Math.round((used / limit) * 100));

        const storageInfoEl = document.getElementById('storage-info');
        if (storageInfoEl) {
            storageInfoEl.textContent = `${utils.formatBytes(used)} of ${utils.formatBytes(limit)} used`;
        }

        const storageBar = document.getElementById('files-storage-bar');
        if (storageBar) {
            storageBar.style.width = `${percentage}%`;
            storageBar.classList.remove('warning', 'danger');
            if (percentage > 90) {
                storageBar.classList.add('danger');
            } else if (percentage > 70) {
                storageBar.classList.add('warning');
            }
        }
    } catch (error) {
        console.error('Update storage info error:', error);
    }
}

// Storage tracking is handled by the MongoDB API

// Update breadcrumb
function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    const parts = currentPath.split('/').filter(Boolean);

    let html = '<span class="breadcrumb-item" data-path="/">Root</span>';
    let path = '/';

    parts.forEach((part, index) => {
        path += part + '/';
        const isLast = index === parts.length - 1;
        html += `
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item ${isLast ? 'active' : ''}" data-path="${path}">${utils.escapeHtml(part)}</span>
        `;
    });

    breadcrumb.innerHTML = html;

    // Add click handlers
    breadcrumb.querySelectorAll('.breadcrumb-item:not(.active)').forEach(item => {
        item.addEventListener('click', () => {
            currentPath = item.dataset.path;
            loadFiles();
            updateBreadcrumb();
        });
    });
}

// Export functions for global access
window.renderFiles = renderFiles;
window.downloadFile = downloadFile;
window.renameFile = renameFile;
window.showFileContextMenu = showFileContextMenu;
window.copyFileLink = copyFileLink;
window.confirmDeleteFile = confirmDeleteFile;
