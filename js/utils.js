// Utility Functions

/**
 * Format bytes to human readable string
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date to locale string
 * @param {string|Date} date
 * @returns {string}
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format date for display (shorter format)
 * @param {string|Date} date
 * @returns {string}
 */
function formatDateShort(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Show toast notification
 * @param {string} message
 * @param {string} type - 'success', 'error', 'info', 'warning'
 * @param {number} duration - milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <span class="toast-message">${message}</span>
    `;

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show loading spinner
 * @param {boolean} show
 */
function showLoading(show = true) {
    let loader = document.getElementById('global-loader');
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.innerHTML = `
                <div class="loader-backdrop">
                    <div class="loader-spinner"></div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.classList.add('active');
    } else if (loader) {
        loader.classList.remove('active');
    }
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate unique ID
 * @returns {string}
 */
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get file extension
 * @param {string} filename
 * @returns {string}
 */
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Get file icon based on mime type
 * @param {string} mimeType
 * @returns {string} SVG icon
 */
function getFileIcon(mimeType) {
    const iconMap = {
        'image': '<svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
        'video': '<svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>',
        'audio': '<svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>',
        'application/pdf': '<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>',
        'application/zip': '<svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>',
        'text': '<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
        'default': '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>'
    };

    if (!mimeType) return iconMap.default;

    const type = mimeType.split('/')[0];
    if (iconMap[type]) return iconMap[type];
    if (iconMap[mimeType]) return iconMap[mimeType];
    return iconMap.default;
}

/**
 * Get storage percentage used
 * @param {number} used
 * @param {number} total
 * @returns {number}
 */
function getStoragePercentage(used, total) {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Copy text to clipboard
 * @param {string} text
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success');
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
}

/**
 * Download file from URL
 * @param {string} url
 * @param {string} filename
 */
function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Parse query string
 * @param {string} queryString
 * @returns {Object}
 */
function parseQueryString(queryString) {
    const params = {};
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    return params;
}

/**
 * Get current workspace ID from localStorage
 * @returns {string|null}
 */
function getCurrentWorkspaceId() {
    return localStorage.getItem('currentWorkspaceId');
}

/**
 * Set current workspace ID
 * @param {string} workspaceId
 */
function setCurrentWorkspaceId(workspaceId) {
    localStorage.setItem('currentWorkspaceId', workspaceId);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Confirm dialog
 * @param {string} message
 * @param {string} title
 * @returns {Promise<boolean>}
 */
function confirmDialog(message, title = 'Confirm') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 class="text-lg font-semibold mb-4">${escapeHtml(title)}</h3>
                <p class="text-gray-600 mb-6">${escapeHtml(message)}</p>
                <div class="flex justify-end gap-3">
                    <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
                    <button class="btn btn-primary" id="confirm-ok">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#confirm-cancel').onclick = () => {
            modal.remove();
            resolve(false);
        };
        modal.querySelector('#confirm-ok').onclick = () => {
            modal.remove();
            resolve(true);
        };
    });
}

/**
 * Prompt dialog
 * @param {string} message
 * @param {string} defaultValue
 * @param {string} title
 * @returns {Promise<string|null>}
 */
function promptDialog(message, defaultValue = '', title = 'Input') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 class="text-lg font-semibold mb-4">${escapeHtml(title)}</h3>
                <p class="text-gray-600 mb-4">${escapeHtml(message)}</p>
                <input type="text" class="input w-full mb-6" id="prompt-input" value="${escapeHtml(defaultValue)}">
                <div class="flex justify-end gap-3">
                    <button class="btn btn-secondary" id="prompt-cancel">Cancel</button>
                    <button class="btn btn-primary" id="prompt-ok">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const input = modal.querySelector('#prompt-input');
        input.focus();
        input.select();

        modal.querySelector('#prompt-cancel').onclick = () => {
            modal.remove();
            resolve(null);
        };
        modal.querySelector('#prompt-ok').onclick = () => {
            modal.remove();
            resolve(input.value);
        };
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                modal.remove();
                resolve(input.value);
            }
        };
    });
}

// Export utilities
window.utils = {
    formatBytes,
    formatDate,
    formatDateShort,
    showToast,
    showLoading,
    debounce,
    generateId,
    getFileExtension,
    getFileIcon,
    getStoragePercentage,
    isValidEmail,
    copyToClipboard,
    downloadFile,
    parseQueryString,
    getCurrentWorkspaceId,
    setCurrentWorkspaceId,
    escapeHtml,
    confirmDialog,
    promptDialog
};
