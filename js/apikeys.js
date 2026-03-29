/**
 * JT Mobamba API Key Management
 * Dashboard module for managing API keys and viewing connection documentation
 */

const APIKeysModule = {
    currentCollection: null,
    currentCollectionName: null,
    apiKeys: [],
    collections: [],

    async init() {
        console.log('APIKeysModule.init() called');
        await this.loadCollections();
        this.setupEventListeners();
        console.log('APIKeysModule initialized, collections:', this.collections.length);
    },

    setupEventListeners() {
        // Create API key button
        const createBtn = document.getElementById('create-api-key-btn');
        console.log('Setting up event listener for create-api-key-btn:', createBtn);

        if (createBtn) {
            createBtn.addEventListener('click', () => {
                console.log('Create API Key button clicked');
                this.showCreateKeyModal();
            });
        } else {
            console.error('create-api-key-btn not found!');
        }

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModals();
            }
        });
    },

    async loadCollections() {
        try {
            const response = await api.request('/database/collections');
            this.collections = response.collections || [];
            this.renderCollectionsList();

            // Auto-select first collection
            if (this.collections.length > 0 && !this.currentCollection) {
                await this.selectCollection(this.collections[0]._id, this.collections[0].name);
            }
        } catch (error) {
            console.error('Failed to load collections:', error);
            this.showError('Failed to load collections');
        }
    },

    renderCollectionsList() {
        const container = document.getElementById('api-collections-list');
        if (!container) return;

        if (this.collections.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--color-text-secondary);">
                    <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                    <p style="font-weight: 500; margin-bottom: 0.5rem;">No collections found</p>
                    <p class="text-sm">You need to create a database collection first before you can generate API keys.</p>
                    <button class="btn btn-primary btn-sm mt-3" onclick="navigateToModule('database')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Go to Database Panel
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.collections.map(col => `
            <div class="collection-item ${col._id === this.currentCollection ? 'active' : ''}"
                 data-id="${col._id}" data-name="${col.name}">
                <div class="collection-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                </div>
                <div class="collection-info">
                    <span class="collection-name">${col.name}</span>
                    <span class="table-count">${col.tableCount} table${col.tableCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.collection-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectCollection(item.dataset.id, item.dataset.name);
            });
        });
    },

    async selectCollection(collectionId, collectionName) {
        this.currentCollection = collectionId;
        this.currentCollectionName = collectionName;

        // Update active state
        document.querySelectorAll('.collection-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === collectionId);
        });

        // Update header
        const header = document.getElementById('selected-collection-name');
        if (header) header.textContent = collectionName;

        // Load API keys
        await this.loadAPIKeys();
    },

    async loadAPIKeys() {
        if (!this.currentCollection) return;

        try {
            const response = await api.request(`/database/collections/${this.currentCollection}/api-keys`);
            this.apiKeys = response.apiKeys || [];
            this.renderAPIKeys();
            this.renderConnectionDocs();
        } catch (error) {
            console.error('Failed to load API keys:', error);
            this.showError('Failed to load API keys');
        }
    },

    renderAPIKeys() {
        const container = document.getElementById('api-keys-list');
        if (!container) return;

        if (this.apiKeys.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 3rem; text-align: center; color: var(--color-text-secondary);">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No API Keys</h3>
                    <p>Create an API key to allow external applications to access this collection</p>
                    <button class="btn btn-primary mt-4" onclick="APIKeysModule.showCreateKeyModal()">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Create API Key
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="api-keys-grid">
                ${this.apiKeys.map(key => this.renderAPIKeyCard(key)).join('')}
            </div>
        `;
    },

    renderAPIKeyCard(key) {
        const permissionBadges = [];
        if (key.permissions.read) permissionBadges.push('<span class="badge badge-success">Read</span>');
        if (key.permissions.insert) permissionBadges.push('<span class="badge badge-info">Insert</span>');
        if (key.permissions.update) permissionBadges.push('<span class="badge badge-warning">Update</span>');
        if (key.permissions.delete) permissionBadges.push('<span class="badge badge-danger">Delete</span>');

        const statusClass = key.isActive ? 'status-active' : 'status-inactive';
        const statusText = key.isActive ? 'Active' : 'Inactive';

        return `
            <div class="api-key-card" data-id="${key._id}">
                <div class="api-key-header">
                    <div class="api-key-info">
                        <h4>${key.name}</h4>
                        <p>${key.description || 'No description'}</p>
                    </div>
                    <div class="api-key-status ${statusClass}">${statusText}</div>
                </div>

                <div class="api-key-credentials">
                    <div class="credential-row">
                        <label>API Key</label>
                        <div class="credential-value">
                            <code>${key.apiKey}</code>
                            <button class="btn btn-ghost btn-icon btn-sm" onclick="APIKeysModule.copyToClipboard('${key.apiKeyFull}', 'API Key')">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="api-key-permissions">
                    <label>Permissions</label>
                    <div class="permissions-badges">${permissionBadges.join('')}</div>
                </div>

                <div class="api-key-stats">
                    <div class="stat">
                        <span class="stat-value">${key.requestCount || 0}</span>
                        <span class="stat-label">Requests</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${key.rateLimit}</span>
                        <span class="stat-label">Rate Limit/hr</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${key.lastRequestAt ? this.formatTimeAgo(new Date(key.lastRequestAt)) : 'Never'}</span>
                        <span class="stat-label">Last Used</span>
                    </div>
                </div>

                <div class="api-key-actions">
                    <button class="btn btn-ghost btn-sm" onclick="APIKeysModule.regenerateSecret('${key._id}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Regenerate Secret
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="APIKeysModule.editAPIKey('${key._id}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="btn btn-ghost btn-sm text-danger" onclick="APIKeysModule.deleteAPIKey('${key._id}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        `;
    },

    renderConnectionDocs() {
        const container = document.getElementById('connection-docs');
        if (!container) return;

        const baseUrl = window.location.origin + '/api/database/v1/data';

        container.innerHTML = `
            <div class="docs-section">
                <h3>Connection Guide</h3>
                <p>Use these endpoints to connect your application to the JT Mobamba Cloud Database.</p>

                <div class="docs-block">
                    <h4>Base URL</h4>
                    <div class="code-block">
                        <code>${baseUrl}</code>
                        <button class="btn btn-ghost btn-icon btn-sm" onclick="APIKeysModule.copyToClipboard('${baseUrl}', 'Base URL')">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="docs-block">
                    <h4>Authentication Headers</h4>
                    <p>Include these headers in every request:</p>
                    <div class="code-block">
<pre>X-API-Key: your_api_key
X-API-Secret: your_secret_key
Content-Type: application/json</pre>
                    </div>
                </div>

                <div class="docs-block">
                    <h4>Available Endpoints</h4>
                    <div class="endpoint-list">
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <code>/info</code>
                            <span class="desc">Get collection info and tables</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <code>/tables</code>
                            <span class="desc">List all tables</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <code>/tables/:tableName</code>
                            <span class="desc">Get table structure</span>
                        </div>
                        <div class="endpoint">
                            <span class="method get">GET</span>
                            <code>/tables/:tableName/rows</code>
                            <span class="desc">Read rows (supports pagination)</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <code>/tables/:tableName/rows</code>
                            <span class="desc">Insert row(s)</span>
                        </div>
                        <div class="endpoint">
                            <span class="method put">PUT</span>
                            <code>/tables/:tableName/rows/:id</code>
                            <span class="desc">Update row</span>
                        </div>
                        <div class="endpoint">
                            <span class="method delete">DELETE</span>
                            <code>/tables/:tableName/rows/:id</code>
                            <span class="desc">Delete row</span>
                        </div>
                        <div class="endpoint">
                            <span class="method post">POST</span>
                            <code>/sql</code>
                            <span class="desc">Execute SQL query</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="docs-section">
                <h3>Code Examples</h3>

                <div class="example-tabs">
                    <button class="example-tab active" data-lang="javascript">JavaScript</button>
                    <button class="example-tab" data-lang="python">Python</button>
                    <button class="example-tab" data-lang="curl">cURL</button>
                </div>

                <div class="example-content" id="example-javascript">
                    <h4>Read Data</h4>
                    <div class="code-block">
<pre>// Fetch data from your table
const response = await fetch('${baseUrl}/tables/users/rows', {
    method: 'GET',
    headers: {
        'X-API-Key': 'your_api_key',
        'X-API-Secret': 'your_secret_key',
        'Content-Type': 'application/json'
    }
});

const data = await response.json();
console.log(data);</pre>
                    </div>

                    <h4>Insert Data</h4>
                    <div class="code-block">
<pre>// Insert a new row
const response = await fetch('${baseUrl}/tables/users/rows', {
    method: 'POST',
    headers: {
        'X-API-Key': 'your_api_key',
        'X-API-Secret': 'your_secret_key',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
    })
});

const result = await response.json();
console.log(result);</pre>
                    </div>

                    <h4>Execute SQL</h4>
                    <div class="code-block">
<pre>// Run SQL query
const response = await fetch('${baseUrl}/sql', {
    method: 'POST',
    headers: {
        'X-API-Key': 'your_api_key',
        'X-API-Secret': 'your_secret_key',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        sql: "SELECT * FROM users WHERE age > 25 ORDER BY name"
    })
});

const result = await response.json();
console.log(result);</pre>
                    </div>
                </div>

                <div class="example-content" id="example-python" style="display: none;">
                    <h4>Read Data</h4>
                    <div class="code-block">
<pre>import requests

headers = {
    'X-API-Key': 'your_api_key',
    'X-API-Secret': 'your_secret_key',
    'Content-Type': 'application/json'
}

response = requests.get(
    '${baseUrl}/tables/users/rows',
    headers=headers
)

data = response.json()
print(data)</pre>
                    </div>

                    <h4>Insert Data</h4>
                    <div class="code-block">
<pre>import requests

headers = {
    'X-API-Key': 'your_api_key',
    'X-API-Secret': 'your_secret_key',
    'Content-Type': 'application/json'
}

payload = {
    'name': 'John Doe',
    'email': 'john@example.com',
    'age': 30
}

response = requests.post(
    '${baseUrl}/tables/users/rows',
    headers=headers,
    json=payload
)

result = response.json()
print(result)</pre>
                    </div>
                </div>

                <div class="example-content" id="example-curl" style="display: none;">
                    <h4>Read Data</h4>
                    <div class="code-block">
<pre>curl -X GET "${baseUrl}/tables/users/rows" \\
  -H "X-API-Key: your_api_key" \\
  -H "X-API-Secret: your_secret_key" \\
  -H "Content-Type: application/json"</pre>
                    </div>

                    <h4>Insert Data</h4>
                    <div class="code-block">
<pre>curl -X POST "${baseUrl}/tables/users/rows" \\
  -H "X-API-Key: your_api_key" \\
  -H "X-API-Secret: your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'</pre>
                    </div>
                </div>
            </div>
        `;

        // Setup tab switching
        container.querySelectorAll('.example-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.example-tab').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.example-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                document.getElementById(`example-${tab.dataset.lang}`).style.display = 'block';
            });
        });
    },

    showCreateKeyModal() {
        console.log('showCreateKeyModal called, currentCollection:', this.currentCollection);

        if (!this.currentCollection) {
            alert('Please select a collection from the sidebar first before creating an API key.');
            this.showError('Please select a collection first');
            return;
        }

        // Remove any existing modals first
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';  // Added 'active' class to make it visible
        modal.id = 'create-key-modal';
        modal.setAttribute('style', 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.6) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 99999 !important; padding: 20px !important; opacity: 1 !important; visibility: visible !important;');
        modal.innerHTML = `
            <div class="modal" style="width: 100% !important; max-width: 500px !important; background: #ffffff !important; border-radius: 12px !important; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important; max-height: 90vh !important; overflow-y: auto !important; margin: auto !important;">
                <div class="modal-header" style="display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 1.25rem 1.5rem !important; border-bottom: 1px solid #e5e5e5 !important; background: #ffffff !important;">
                    <h3 style="font-size: 1.125rem !important; font-weight: 600 !important; margin: 0 !important; color: #1a1a1a !important;">Create API Key</h3>
                    <button class="btn btn-ghost btn-icon" onclick="APIKeysModule.closeModals()">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="padding: 1.5rem !important; background: #ffffff !important;">
                    <form id="create-key-form">
                        <div class="form-group" style="margin-bottom: 1.25rem !important;">
                            <label style="display: block !important; font-size: 0.875rem !important; font-weight: 500 !important; margin-bottom: 0.5rem !important; color: #1a1a1a !important;">Collection</label>
                            <input type="text" value="${this.currentCollectionName}" disabled style="width: 100% !important; padding: 0.625rem 0.875rem !important; font-size: 0.875rem !important; border: 1px solid #e5e5e5 !important; border-radius: 8px !important; background: #f5f5f5 !important; color: #666 !important;">
                        </div>
                        <div class="form-group">
                            <label>Key Name *</label>
                            <input type="text" id="key-name" class="form-input" placeholder="e.g., Production API Key" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="key-description" class="form-input" rows="2" placeholder="Optional description"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Permissions</label>
                            <div class="permissions-checkboxes">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="perm-read" checked>
                                    <span>Read</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="perm-insert" checked>
                                    <span>Insert</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="perm-update" checked>
                                    <span>Update</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="perm-delete">
                                    <span>Delete</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Rate Limit (requests/hour)</label>
                            <input type="number" id="key-rate-limit" class="form-input" value="1000" min="100" max="100000">
                        </div>
                        <div class="form-group">
                            <label>Allowed Origins (optional, one per line)</label>
                            <textarea id="key-origins" class="form-input" rows="2" placeholder="https://myapp.com&#10;https://localhost:3000"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #e5e5e5;">
                    <button class="btn btn-ghost" style="padding: 0.5rem 1rem; border: 1px solid #e5e5e5; border-radius: 6px; background: white; cursor: pointer;" onclick="APIKeysModule.closeModals()">Cancel</button>
                    <button class="btn btn-primary" style="padding: 0.5rem 1rem; border: none; border-radius: 6px; background: #C4815D; color: white; cursor: pointer;" onclick="APIKeysModule.createAPIKey()">Create API Key</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('Modal appended to body');
    },

    async createAPIKey() {
        const name = document.getElementById('key-name').value.trim();
        const description = document.getElementById('key-description').value.trim();
        const rateLimit = parseInt(document.getElementById('key-rate-limit').value) || 1000;
        const originsText = document.getElementById('key-origins').value.trim();
        const allowedOrigins = originsText ? originsText.split('\n').map(o => o.trim()).filter(o => o) : [];

        const permissions = {
            read: document.getElementById('perm-read').checked,
            insert: document.getElementById('perm-insert').checked,
            update: document.getElementById('perm-update').checked,
            delete: document.getElementById('perm-delete').checked
        };

        if (!name) {
            this.showError('API key name is required');
            return;
        }

        try {
            const response = await api.request(`/database/collections/${this.currentCollection}/api-keys`, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    description,
                    permissions,
                    allowedOrigins,
                    rateLimit
                })
            });

            this.closeModals();
            this.showCredentialsModal(response.credentials);
            await this.loadAPIKeys();
        } catch (error) {
            this.showError(error.message);
        }
    },

    showCredentialsModal(credentials) {
        // Remove any existing modals first
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'credentials-modal';
        modal.setAttribute('style', 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: rgba(0,0,0,0.6) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 99999 !important; padding: 20px !important; opacity: 1 !important; visibility: visible !important;');
        modal.innerHTML = `
            <div class="modal" style="max-width: 600px !important; background: #ffffff !important; border-radius: 12px !important; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important;">
                <div class="modal-header">
                    <h3>API Key Created Successfully</h3>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning" style="margin-bottom: 1.5rem;">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <span>Save these credentials now! The Secret Key will NOT be shown again.</span>
                    </div>

                    <div class="credentials-display">
                        <div class="credential-item">
                            <label>API Key</label>
                            <div class="credential-value-box">
                                <code id="modal-api-key">${credentials.apiKey}</code>
                                <button class="btn btn-ghost btn-sm" onclick="APIKeysModule.copyToClipboard('${credentials.apiKey}', 'API Key')">Copy</button>
                            </div>
                        </div>
                        <div class="credential-item">
                            <label>Secret Key</label>
                            <div class="credential-value-box secret">
                                <code id="modal-secret-key">${credentials.secretKey}</code>
                                <button class="btn btn-ghost btn-sm" onclick="APIKeysModule.copyToClipboard('${credentials.secretKey}', 'Secret Key')">Copy</button>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary btn-block mt-4" onclick="APIKeysModule.copyBothCredentials('${credentials.apiKey}', '${credentials.secretKey}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        Copy Both Credentials
                    </button>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="APIKeysModule.closeModals()">I've Saved My Credentials</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    async regenerateSecret(keyId) {
        if (!confirm('Are you sure you want to regenerate the secret key? The old secret will stop working immediately.')) {
            return;
        }

        try {
            const response = await api.request(`/database/collections/${this.currentCollection}/api-keys/${keyId}/regenerate`, {
                method: 'POST'
            });

            this.showCredentialsModal(response.credentials);
        } catch (error) {
            this.showError(error.message);
        }
    },

    async editAPIKey(keyId) {
        const key = this.apiKeys.find(k => k._id === keyId);
        if (!key) return;

        // Remove any existing modals first
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'edit-key-modal';
        modal.setAttribute('style', 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: rgba(0,0,0,0.6) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 99999 !important; padding: 20px !important; opacity: 1 !important; visibility: visible !important;');
        modal.innerHTML = `
            <div class="modal" style="max-width: 500px !important; background: #ffffff !important; border-radius: 12px !important; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25) !important;">
                <div class="modal-header">
                    <h3>Edit API Key</h3>
                    <button class="btn btn-ghost btn-icon" onclick="APIKeysModule.closeModals()">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="edit-key-form">
                        <div class="form-group">
                            <label>Key Name</label>
                            <input type="text" id="edit-key-name" class="form-input" value="${key.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="edit-key-description" class="form-input" rows="2">${key.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="edit-key-status" class="form-input">
                                <option value="true" ${key.isActive ? 'selected' : ''}>Active</option>
                                <option value="false" ${!key.isActive ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Permissions</label>
                            <div class="permissions-checkboxes">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="edit-perm-read" ${key.permissions.read ? 'checked' : ''}>
                                    <span>Read</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="edit-perm-insert" ${key.permissions.insert ? 'checked' : ''}>
                                    <span>Insert</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="edit-perm-update" ${key.permissions.update ? 'checked' : ''}>
                                    <span>Update</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="edit-perm-delete" ${key.permissions.delete ? 'checked' : ''}>
                                    <span>Delete</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Rate Limit (requests/hour)</label>
                            <input type="number" id="edit-key-rate-limit" class="form-input" value="${key.rateLimit}" min="100" max="100000">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="APIKeysModule.closeModals()">Cancel</button>
                    <button class="btn btn-primary" onclick="APIKeysModule.updateAPIKey('${keyId}')">Save Changes</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    async updateAPIKey(keyId) {
        const name = document.getElementById('edit-key-name').value.trim();
        const description = document.getElementById('edit-key-description').value.trim();
        const isActive = document.getElementById('edit-key-status').value === 'true';
        const rateLimit = parseInt(document.getElementById('edit-key-rate-limit').value) || 1000;

        const permissions = {
            read: document.getElementById('edit-perm-read').checked,
            insert: document.getElementById('edit-perm-insert').checked,
            update: document.getElementById('edit-perm-update').checked,
            delete: document.getElementById('edit-perm-delete').checked
        };

        try {
            await api.request(`/database/collections/${this.currentCollection}/api-keys/${keyId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name,
                    description,
                    permissions,
                    isActive,
                    rateLimit
                })
            });

            this.closeModals();
            this.showSuccess('API key updated successfully');
            await this.loadAPIKeys();
        } catch (error) {
            this.showError(error.message);
        }
    },

    async deleteAPIKey(keyId) {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return;
        }

        try {
            await api.request(`/database/collections/${this.currentCollection}/api-keys/${keyId}`, {
                method: 'DELETE'
            });

            this.showSuccess('API key deleted successfully');
            await this.loadAPIKeys();
        } catch (error) {
            this.showError(error.message);
        }
    },

    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
    },

    copyToClipboard(text, label) {
        navigator.clipboard.writeText(text).then(() => {
            this.showSuccess(`${label} copied to clipboard`);
        }).catch(() => {
            this.showError('Failed to copy to clipboard');
        });
    },

    copyBothCredentials(apiKey, secretKey) {
        const text = `API Key: ${apiKey}\nSecret Key: ${secretKey}`;
        navigator.clipboard.writeText(text).then(() => {
            this.showSuccess('Both credentials copied to clipboard');
        }).catch(() => {
            this.showError('Failed to copy to clipboard');
        });
    },

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }

        return 'Just now';
    },

    showSuccess(message) {
        this.showToast(message, 'success');
    },

    showError(message) {
        this.showToast(message, 'error');
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    },

    // Render the API module content
    renderContent() {
        return `
            <div class="api-module">
                <div class="api-sidebar">
                    <div class="api-sidebar-header">
                        <h3>Collections</h3>
                    </div>
                    <div class="api-sidebar-content" id="api-collections-list">
                        <div style="padding: 1rem; text-align: center; color: var(--color-text-muted);">
                            <div class="loading-spinner" style="margin: 0 auto;"></div>
                            <p style="margin-top: 0.5rem; font-size: 0.875rem;">Loading collections...</p>
                        </div>
                    </div>
                </div>

                <div class="api-main">
                    <div class="api-main-header">
                        <div class="api-main-title">
                            <h2>API Keys</h2>
                            <span class="collection-badge" id="selected-collection-name">Select a collection</span>
                        </div>
                        <button class="btn btn-primary" id="create-api-key-btn">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Create API Key
                        </button>
                    </div>

                    <div class="api-content">
                        <div class="api-keys-section" id="api-keys-list">
                            <div class="empty-state" style="padding: 3rem; text-align: center; color: var(--color-text-secondary);">
                                <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
                                </svg>
                                <p style="font-weight: 500;">Select a Collection</p>
                                <p style="font-size: 0.875rem; margin-top: 0.25rem;">Choose a collection from the sidebar to manage its API keys</p>
                            </div>
                        </div>

                        <div class="api-docs-section" id="connection-docs">
                            <!-- Connection documentation will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Export for use in dashboard
window.APIKeysModule = APIKeysModule;
