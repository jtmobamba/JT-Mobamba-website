// SQL Database Management Module
// Hierarchy: Collections (Databases) -> Tables -> Rows
// Supports: CREATE TABLE, INSERT, SELECT, UPDATE, DELETE, SHOW TABLES, DESCRIBE

let currentCollection = null;
let currentCollectionName = null;
let currentTable = null;
let tableSchema = null;
let tableData = [];
let currentPage = 1;
let pageSize = 25;

const DB_API_URL = 'http://localhost:5000/api/database';

// Helper function for API calls
async function dbFetch(endpoint, options = {}) {
    const token = localStorage.getItem('jt_auth_token');
    const response = await fetch(`${DB_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

async function renderDatabase(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Collections & Tables Sidebar -->
            <div class="lg:col-span-1">
                <!-- Collections (Databases) -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Collections</h3>
                        <button class="btn btn-primary btn-sm" id="new-collection-btn" title="Create Collection">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="card-body p-0" id="collections-list">
                        <div class="p-4 text-center text-gray-500 text-sm">Loading collections...</div>
                    </div>
                </div>

                <!-- Tables in Selected Collection -->
                <div class="card mt-4" id="tables-card" style="display: none;">
                    <div class="card-header">
                        <h3 class="card-title">
                            <span class="text-gray-400">Tables in</span>
                            <span id="selected-collection-name" class="font-mono ml-1"></span>
                        </h3>
                        <button class="btn btn-primary btn-sm" id="new-table-btn" title="Create Table">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="card-body p-0" id="tables-list">
                        <div class="p-4 text-center text-gray-500 text-sm">No tables</div>
                    </div>
                </div>

                <!-- Database Info -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h3 class="card-title text-sm">Database Engine</h3>
                    </div>
                    <div class="card-body text-xs text-gray-500 space-y-1">
                        <div class="flex justify-between"><span>Engine:</span><span class="font-mono">SQLOS</span></div>
                        <div class="flex justify-between"><span>Storage:</span><span class="font-mono">MongoDB</span></div>
                        <div class="flex justify-between"><span>Protocol:</span><span class="font-mono">SQL-like</span></div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="lg:col-span-3">
                <!-- Welcome/No Selection State -->
                <div id="no-selection-state">
                    <div class="card">
                        <div class="card-body text-center py-12">
                            <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                            </svg>
                            <h2 class="text-xl font-semibold text-gray-700 mb-2">Welcome to Database Manager</h2>
                            <p class="text-gray-500 mb-4">Select a collection to view tables, or create a new collection to get started.</p>
                            <button class="btn btn-primary" onclick="showCreateCollectionModal()">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Create Collection
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Table Content (hidden until table selected) -->
                <div id="table-content" style="display: none;">
                    <!-- Tabs -->
                    <div class="tabs" id="db-tabs">
                        <div class="tab active" data-tab="data">Table Data</div>
                        <div class="tab" data-tab="sql">SQL Editor</div>
                        <div class="tab" data-tab="structure">Structure</div>
                    </div>

                    <!-- Table Header -->
                    <div class="card mb-4" id="table-header">
                        <div class="card-body py-3">
                            <div class="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <div class="text-xs text-gray-400 mb-1">
                                        <span id="breadcrumb-collection"></span> / <span id="breadcrumb-table"></span>
                                    </div>
                                    <h2 class="text-lg font-semibold font-mono" id="table-name">Select a table</h2>
                                    <p class="text-sm text-gray-500"><span id="table-row-count">0</span> rows</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button class="btn btn-primary btn-sm" id="insert-row-btn">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                        </svg>
                                        Insert Row
                                    </button>
                                    <button class="btn btn-ghost btn-sm text-red-500" id="drop-table-btn" title="Drop Table">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Data Tab -->
                    <div id="data-tab-content">
                        <div class="card">
                            <div class="card-body p-0">
                                <div class="table-container" style="max-height: 500px; overflow: auto;">
                                    <table class="data-table" id="data-table">
                                        <thead>
                                            <tr id="table-headers"></tr>
                                        </thead>
                                        <tbody id="table-body">
                                            <tr>
                                                <td colspan="100" class="text-center py-8 text-gray-500">
                                                    Select a table to view data
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="card-footer" id="pagination-footer" style="display: none;">
                                <div class="flex items-center justify-between">
                                    <div class="text-sm text-gray-500">
                                        Showing <span id="page-start">0</span>-<span id="page-end">0</span> of <span id="total-rows">0</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button class="btn btn-secondary btn-sm" id="prev-page-btn" disabled>Previous</button>
                                        <button class="btn btn-secondary btn-sm" id="next-page-btn" disabled>Next</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SQL Editor Tab -->
                    <div id="sql-tab-content" style="display: none;">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h3 class="card-title">SQL Query Editor</h3>
                                <span class="badge badge-neutral" id="sql-collection-badge"></span>
                            </div>
                            <div class="card-body p-0">
                                <textarea id="sql-editor" class="w-full p-4 font-mono text-sm bg-gray-900 text-green-400 border-0 rounded-none" rows="8" placeholder="-- Enter SQL query (within current collection)
-- Supported: CREATE TABLE, INSERT INTO, SELECT, UPDATE, DELETE, SHOW TABLES, DESCRIBE

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    age INT,
    created_at TIMESTAMP
);

INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 30);

SELECT * FROM users WHERE age > 25 ORDER BY name LIMIT 10;"></textarea>
                            </div>
                            <div class="card-footer">
                                <div class="flex items-center justify-between">
                                    <div class="text-sm text-gray-500">
                                        <span class="font-mono">Ctrl+Enter</span> to execute
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="btn btn-secondary btn-sm" id="clear-sql-btn">Clear</button>
                                        <button class="btn btn-primary btn-sm" id="run-sql-btn">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            Execute
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Results</h3>
                                <div class="flex items-center gap-2">
                                    <span class="badge badge-neutral" id="query-type">-</span>
                                    <span class="badge badge-success" id="query-time">0ms</span>
                                </div>
                            </div>
                            <div class="card-body p-0">
                                <div id="sql-results" style="max-height: 400px; overflow: auto;">
                                    <div class="p-8 text-center text-gray-500">
                                        Execute a query to see results
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Structure Tab -->
                    <div id="structure-tab-content" style="display: none;">
                        <div class="card" id="structure-card">
                            <div class="card-body">
                                <div class="p-8 text-center text-gray-500">
                                    Select a table to view its structure
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Collection Modal -->
        <div class="modal-overlay" id="create-collection-modal">
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h3 class="modal-title">Create New Collection</h3>
                    <button class="modal-close" id="close-create-collection-modal">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="create-collection-form">
                    <div class="form-group mb-4">
                        <label class="form-label">Collection Name</label>
                        <input type="text" class="input font-mono" id="new-collection-name" placeholder="my_database" pattern="[a-zA-Z][a-zA-Z0-9_]*" required>
                        <p class="text-xs text-gray-500 mt-1">A collection acts as a database container for your tables.</p>
                    </div>
                    <div class="form-group mb-4">
                        <label class="form-label">Description (optional)</label>
                        <input type="text" class="input" id="new-collection-desc" placeholder="Description of this collection">
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" class="btn btn-secondary" id="cancel-create-collection">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Collection</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Create Table Modal -->
        <div class="modal-overlay" id="create-table-modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 class="modal-title">Create New Table</h3>
                    <button class="modal-close" id="close-create-table-modal">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="create-table-form">
                    <div class="bg-gray-50 p-2 rounded mb-4 text-sm">
                        <span class="text-gray-500">Creating in:</span>
                        <span class="font-mono font-medium" id="create-table-collection-name"></span>
                    </div>
                    <div class="form-group mb-4">
                        <label class="form-label">Table Name</label>
                        <input type="text" class="input font-mono" id="new-table-name" placeholder="my_table" pattern="[a-zA-Z][a-zA-Z0-9_]*" required>
                    </div>

                    <div class="form-group mb-4">
                        <label class="form-label">Columns</label>
                        <div id="columns-container" class="space-y-2">
                            <!-- Column rows will be added here -->
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm mt-2" id="add-column-btn">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Add Column
                        </button>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" class="btn btn-secondary" id="cancel-create-table">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Table</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Insert Row Modal -->
        <div class="modal-overlay" id="insert-row-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">Insert Row</h3>
                    <button class="modal-close" id="close-insert-modal">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="insert-row-form">
                    <div id="insert-fields">
                        <!-- Fields will be generated here -->
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" class="btn btn-secondary" id="cancel-insert">Cancel</button>
                        <button type="submit" class="btn btn-primary">Insert</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit Row Modal -->
        <div class="modal-overlay" id="edit-row-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">Edit Row</h3>
                    <button class="modal-close" id="close-edit-modal">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="edit-row-form">
                    <input type="hidden" id="edit-row-id">
                    <div id="edit-fields">
                        <!-- Fields will be generated here -->
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" class="btn btn-secondary" id="cancel-edit">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setupDatabaseHandlers();
    await loadCollections();
}

function setupDatabaseHandlers() {
    // Tab switching
    document.querySelectorAll('#db-tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#db-tabs .tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabName = tab.dataset.tab;
            document.getElementById('data-tab-content').style.display = tabName === 'data' ? 'block' : 'none';
            document.getElementById('sql-tab-content').style.display = tabName === 'sql' ? 'block' : 'none';
            document.getElementById('structure-tab-content').style.display = tabName === 'structure' ? 'block' : 'none';
        });
    });

    // Create collection modal
    document.getElementById('new-collection-btn').addEventListener('click', showCreateCollectionModal);
    document.getElementById('close-create-collection-modal').addEventListener('click', () => {
        document.getElementById('create-collection-modal').classList.remove('active');
    });
    document.getElementById('cancel-create-collection').addEventListener('click', () => {
        document.getElementById('create-collection-modal').classList.remove('active');
    });
    document.getElementById('create-collection-form').addEventListener('submit', handleCreateCollection);

    // Create table modal
    document.getElementById('new-table-btn').addEventListener('click', showCreateTableModal);
    document.getElementById('close-create-table-modal').addEventListener('click', () => {
        document.getElementById('create-table-modal').classList.remove('active');
    });
    document.getElementById('cancel-create-table').addEventListener('click', () => {
        document.getElementById('create-table-modal').classList.remove('active');
    });
    document.getElementById('add-column-btn').addEventListener('click', addColumnRow);
    document.getElementById('create-table-form').addEventListener('submit', handleCreateTable);

    // Insert row modal
    document.getElementById('insert-row-btn').addEventListener('click', showInsertModal);
    document.getElementById('close-insert-modal').addEventListener('click', () => {
        document.getElementById('insert-row-modal').classList.remove('active');
    });
    document.getElementById('cancel-insert').addEventListener('click', () => {
        document.getElementById('insert-row-modal').classList.remove('active');
    });
    document.getElementById('insert-row-form').addEventListener('submit', handleInsertRow);

    // Edit row modal
    document.getElementById('close-edit-modal').addEventListener('click', () => {
        document.getElementById('edit-row-modal').classList.remove('active');
    });
    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('edit-row-modal').classList.remove('active');
    });
    document.getElementById('edit-row-form').addEventListener('submit', handleUpdateRow);

    // Drop table
    document.getElementById('drop-table-btn').addEventListener('click', handleDropTable);

    // SQL editor
    document.getElementById('sql-editor').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            executeSQL();
        }
    });
    document.getElementById('run-sql-btn').addEventListener('click', executeSQL);
    document.getElementById('clear-sql-btn').addEventListener('click', () => {
        document.getElementById('sql-editor').value = '';
    });

    // Pagination
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTableData();
        }
    });
    document.getElementById('next-page-btn').addEventListener('click', () => {
        currentPage++;
        loadTableData();
    });

    // Close modals on backdrop click
    ['create-collection-modal', 'create-table-modal', 'insert-row-modal', 'edit-row-modal'].forEach(id => {
        document.getElementById(id).addEventListener('click', (e) => {
            if (e.target.id === id) {
                document.getElementById(id).classList.remove('active');
            }
        });
    });
}

// ============================================
// Collections Management
// ============================================

async function loadCollections() {
    const collectionsList = document.getElementById('collections-list');
    collectionsList.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">Loading...</div>';

    try {
        const data = await dbFetch('/collections');
        renderCollectionsList(data.collections || []);
    } catch (error) {
        console.error('Load collections error:', error);
        collectionsList.innerHTML = `<div class="p-4 text-center text-red-500 text-sm">${error.message}</div>`;
    }
}

function renderCollectionsList(collections) {
    const collectionsList = document.getElementById('collections-list');

    if (!collections || collections.length === 0) {
        collectionsList.innerHTML = `
            <div class="p-4 text-center text-gray-500 text-sm">
                <p>No collections</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="showCreateCollectionModal()">Create Collection</button>
            </div>
        `;
        return;
    }

    collectionsList.innerHTML = `
        <div class="divide-y divide-gray-100">
            ${collections.map(c => `
                <div class="collection-item p-3 cursor-pointer hover:bg-gray-50 ${currentCollection === c._id ? 'bg-blue-50 border-l-2 border-blue-500' : ''}" data-collection="${c._id}" data-name="${c.name}">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                        </svg>
                        <span class="font-mono text-sm">${c.name}</span>
                        <span class="text-xs text-gray-400 ml-auto">${c.tableCount} tables</span>
                    </div>
                    ${c.description ? `<p class="text-xs text-gray-400 mt-1 ml-6">${c.description}</p>` : ''}
                </div>
            `).join('')}
        </div>
    `;

    // Add click handlers
    collectionsList.querySelectorAll('.collection-item').forEach(item => {
        item.addEventListener('click', () => selectCollection(item.dataset.collection, item.dataset.name));

        // Right-click context menu for delete
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showCollectionContextMenu(e, item.dataset.collection, item.dataset.name);
        });
    });
}

function showCollectionContextMenu(e, collectionId, collectionName) {
    // Remove existing context menu
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-menu-item text-red-500" data-action="delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete Collection
        </div>
    `;
    menu.style.cssText = `position: fixed; left: ${e.clientX}px; top: ${e.clientY}px; z-index: 1000; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 4px 0;`;

    menu.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        menu.remove();
        await handleDeleteCollection(collectionId, collectionName);
    });

    document.body.appendChild(menu);

    // Remove on click outside
    setTimeout(() => {
        document.addEventListener('click', function handler() {
            menu.remove();
            document.removeEventListener('click', handler);
        });
    }, 0);
}

async function selectCollection(collectionId, collectionName) {
    currentCollection = collectionId;
    currentCollectionName = collectionName;
    currentTable = null;
    tableSchema = null;

    // Update UI
    document.querySelectorAll('.collection-item').forEach(item => {
        item.classList.toggle('bg-blue-50', item.dataset.collection === collectionId);
        item.classList.toggle('border-l-2', item.dataset.collection === collectionId);
        item.classList.toggle('border-blue-500', item.dataset.collection === collectionId);
    });

    // Show tables card
    document.getElementById('tables-card').style.display = 'block';
    document.getElementById('selected-collection-name').textContent = collectionName;

    // Hide table content, show no-selection state initially
    document.getElementById('table-content').style.display = 'none';
    document.getElementById('no-selection-state').style.display = 'block';

    // Load tables
    await loadTables();
}

function showCreateCollectionModal() {
    document.getElementById('new-collection-name').value = '';
    document.getElementById('new-collection-desc').value = '';
    document.getElementById('create-collection-modal').classList.add('active');
}

async function handleCreateCollection(e) {
    e.preventDefault();

    const name = document.getElementById('new-collection-name').value.trim();
    const description = document.getElementById('new-collection-desc').value.trim();

    try {
        const result = await dbFetch('/collections', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });

        utils.showToast('Collection created successfully!', 'success');
        document.getElementById('create-collection-modal').classList.remove('active');

        await loadCollections();
        selectCollection(result.collection._id, result.collection.name);

    } catch (error) {
        utils.showToast(error.message, 'error');
    }
}

async function handleDeleteCollection(collectionId, collectionName) {
    const confirmed = await utils.confirmDialog(
        `Are you sure you want to delete collection "${collectionName}"? All tables and data will be permanently deleted.`,
        'Delete Collection'
    );
    if (!confirmed) return;

    try {
        await dbFetch(`/collections/${collectionId}`, { method: 'DELETE' });

        utils.showToast('Collection deleted!', 'success');

        if (currentCollection === collectionId) {
            currentCollection = null;
            currentCollectionName = null;
            currentTable = null;
            document.getElementById('tables-card').style.display = 'none';
            document.getElementById('table-content').style.display = 'none';
            document.getElementById('no-selection-state').style.display = 'block';
        }

        await loadCollections();

    } catch (error) {
        utils.showToast(error.message, 'error');
    }
}

// ============================================
// Tables Management
// ============================================

async function loadTables() {
    if (!currentCollection) return;

    const tablesList = document.getElementById('tables-list');
    tablesList.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">Loading...</div>';

    try {
        const data = await dbFetch(`/collections/${currentCollection}/tables`);
        renderTablesList(data.tables || []);
    } catch (error) {
        console.error('Load tables error:', error);
        tablesList.innerHTML = `<div class="p-4 text-center text-red-500 text-sm">${error.message}</div>`;
    }
}

function renderTablesList(tables) {
    const tablesList = document.getElementById('tables-list');

    if (!tables || tables.length === 0) {
        tablesList.innerHTML = `
            <div class="p-4 text-center text-gray-500 text-sm">
                <p>No tables</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="showCreateTableModal()">Create Table</button>
            </div>
        `;
        return;
    }

    tablesList.innerHTML = `
        <div class="divide-y divide-gray-100">
            ${tables.map(t => `
                <div class="table-item p-3 cursor-pointer hover:bg-gray-50 ${currentTable === t.name ? 'bg-orange-50' : ''}" data-table="${t.name}">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-mono text-sm">${t.name}</span>
                        <span class="text-xs text-gray-400 ml-auto">${t.rowCount} rows</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add click handlers
    tablesList.querySelectorAll('.table-item').forEach(item => {
        item.addEventListener('click', () => selectTable(item.dataset.table));
    });
}

async function selectTable(tableName) {
    currentTable = tableName;
    currentPage = 1;

    // Update UI
    document.querySelectorAll('.table-item').forEach(item => {
        item.classList.toggle('bg-orange-50', item.dataset.table === tableName);
    });

    // Show table content
    document.getElementById('no-selection-state').style.display = 'none';
    document.getElementById('table-content').style.display = 'block';

    // Update breadcrumb and title
    document.getElementById('breadcrumb-collection').textContent = currentCollectionName;
    document.getElementById('breadcrumb-table').textContent = tableName;
    document.getElementById('table-name').textContent = tableName;
    document.getElementById('sql-collection-badge').textContent = currentCollectionName;

    // Load table structure
    await loadTableStructure();

    // Load table data
    await loadTableData();
}

async function loadTableStructure() {
    if (!currentCollection || !currentTable) return;

    try {
        const data = await dbFetch(`/collections/${currentCollection}/tables/${currentTable}`);
        tableSchema = data.table;

        // Render structure tab
        renderStructure();
    } catch (error) {
        console.error('Load structure error:', error);
    }
}

function renderStructure() {
    const card = document.getElementById('structure-card');

    if (!tableSchema) {
        card.innerHTML = '<div class="card-body p-8 text-center text-gray-500">No table selected</div>';
        return;
    }

    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title font-mono">${tableSchema.tableName}</h3>
        </div>
        <div class="card-body p-0">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Nullable</th>
                        <th>Key</th>
                        <th>Default</th>
                        <th>Extra</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableSchema.columns.map(col => `
                        <tr>
                            <td class="font-mono">${col.name}</td>
                            <td><span class="badge badge-neutral">${col.dataType}</span></td>
                            <td>${col.nullable ? 'YES' : 'NO'}</td>
                            <td>${col.primaryKey ? '<span class="badge badge-success">PK</span>' : ''}</td>
                            <td class="text-gray-500">${col.defaultValue !== undefined ? col.defaultValue : 'NULL'}</td>
                            <td>${col.autoIncrement ? 'AUTO_INCREMENT' : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadTableData() {
    if (!currentCollection || !currentTable) return;

    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '<tr><td colspan="100" class="text-center py-8 text-gray-500">Loading...</td></tr>';

    try {
        const data = await dbFetch(`/collections/${currentCollection}/tables/${currentTable}/data?page=${currentPage}&limit=${pageSize}`);

        tableData = data.rows || [];
        const total = data.pagination?.total || 0;

        document.getElementById('table-row-count').textContent = total;
        document.getElementById('total-rows').textContent = total;

        renderTableData();

        // Pagination
        const totalPages = Math.ceil(total / pageSize);
        document.getElementById('pagination-footer').style.display = total > 0 ? 'block' : 'none';
        document.getElementById('page-start').textContent = tableData.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0;
        document.getElementById('page-end').textContent = ((currentPage - 1) * pageSize) + tableData.length;
        document.getElementById('prev-page-btn').disabled = currentPage <= 1;
        document.getElementById('next-page-btn').disabled = currentPage >= totalPages;

    } catch (error) {
        console.error('Load data error:', error);
        tableBody.innerHTML = `<tr><td colspan="100" class="text-center py-8 text-red-500">${error.message}</td></tr>`;
    }
}

function renderTableData() {
    const headersRow = document.getElementById('table-headers');
    const tableBody = document.getElementById('table-body');

    if (!tableSchema || !tableData.length) {
        headersRow.innerHTML = '';
        tableBody.innerHTML = '<tr><td colspan="100" class="text-center py-8 text-gray-500">No data</td></tr>';
        return;
    }

    // Headers from schema
    const columns = tableSchema.columns.map(c => c.name);
    headersRow.innerHTML = '<th class="w-12">#</th>' +
        columns.map(col => `<th>${col}</th>`).join('') +
        '<th class="w-24">Actions</th>';

    // Rows
    tableBody.innerHTML = tableData.map((row, index) => `
        <tr>
            <td class="text-gray-400">${row._rowId || index + 1}</td>
            ${columns.map(col => `<td>${formatCellValue(row[col])}</td>`).join('')}
            <td>
                <div class="flex items-center gap-1">
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="editRow(${row._rowId})" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteRow(${row._rowId})" title="Delete">
                        <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function formatCellValue(value) {
    if (value === null || value === undefined) {
        return '<span class="text-gray-400 italic">NULL</span>';
    }
    if (typeof value === 'object') {
        return `<code class="text-xs">${utils.escapeHtml(JSON.stringify(value))}</code>`;
    }
    if (typeof value === 'boolean') {
        return value ? '<span class="text-green-600">true</span>' : '<span class="text-red-600">false</span>';
    }
    return utils.escapeHtml(String(value));
}

// ============================================
// Create Table
// ============================================

function showCreateTableModal() {
    if (!currentCollection) {
        utils.showToast('Select a collection first', 'info');
        return;
    }

    const container = document.getElementById('columns-container');
    container.innerHTML = '';

    // Add initial column
    addColumnRow();

    document.getElementById('new-table-name').value = '';
    document.getElementById('create-table-collection-name').textContent = currentCollectionName;
    document.getElementById('create-table-modal').classList.add('active');
}

function addColumnRow() {
    const container = document.getElementById('columns-container');
    const index = container.children.length;

    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 p-2 bg-gray-50 rounded';
    row.innerHTML = `
        <input type="text" class="input flex-1 font-mono text-sm" placeholder="column_name" name="col_name_${index}" required>
        <select class="input w-32" name="col_type_${index}">
            <option value="VARCHAR">VARCHAR</option>
            <option value="INT">INT</option>
            <option value="FLOAT">FLOAT</option>
            <option value="BOOLEAN">BOOLEAN</option>
            <option value="TEXT">TEXT</option>
            <option value="DATE">DATE</option>
            <option value="TIMESTAMP">TIMESTAMP</option>
            <option value="JSON">JSON</option>
        </select>
        <label class="flex items-center gap-1 text-xs">
            <input type="checkbox" name="col_pk_${index}"> PK
        </label>
        <label class="flex items-center gap-1 text-xs">
            <input type="checkbox" name="col_ai_${index}"> AI
        </label>
        <label class="flex items-center gap-1 text-xs">
            <input type="checkbox" name="col_null_${index}" checked> Null
        </label>
        <button type="button" class="btn btn-ghost btn-icon btn-sm text-red-500" onclick="this.parentElement.remove()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;

    container.appendChild(row);
}

async function handleCreateTable(e) {
    e.preventDefault();

    if (!currentCollection) {
        utils.showToast('Select a collection first', 'error');
        return;
    }

    const tableName = document.getElementById('new-table-name').value.trim();
    const container = document.getElementById('columns-container');
    const columns = [];

    container.querySelectorAll('& > div').forEach((row, index) => {
        const name = row.querySelector(`input[name="col_name_${index}"]`)?.value?.trim();
        const type = row.querySelector(`select[name="col_type_${index}"]`)?.value;
        const pk = row.querySelector(`input[name="col_pk_${index}"]`)?.checked;
        const ai = row.querySelector(`input[name="col_ai_${index}"]`)?.checked;
        const nullable = row.querySelector(`input[name="col_null_${index}"]`)?.checked;

        if (name) {
            columns.push({
                name,
                dataType: type || 'VARCHAR',
                primaryKey: pk || false,
                autoIncrement: ai || false,
                nullable: nullable !== false
            });
        }
    });

    if (columns.length === 0) {
        utils.showToast('Add at least one column', 'error');
        return;
    }

    try {
        await dbFetch(`/collections/${currentCollection}/tables`, {
            method: 'POST',
            body: JSON.stringify({ name: tableName, columns })
        });

        utils.showToast('Table created successfully!', 'success');
        document.getElementById('create-table-modal').classList.remove('active');

        await loadTables();
        selectTable(tableName.toLowerCase());

    } catch (error) {
        utils.showToast(error.message, 'error');
    }
}

// ============================================
// Insert Row
// ============================================

function showInsertModal() {
    if (!currentCollection || !currentTable || !tableSchema) {
        utils.showToast('Select a table first', 'info');
        return;
    }

    const container = document.getElementById('insert-fields');
    container.innerHTML = tableSchema.columns
        .filter(col => !col.autoIncrement)
        .map(col => `
            <div class="form-group">
                <label class="form-label">
                    ${col.name}
                    <span class="text-xs text-gray-400 ml-2">${col.dataType}${col.nullable ? '' : ' NOT NULL'}</span>
                </label>
                <input type="${getInputType(col.dataType)}" class="input font-mono" name="${col.name}" ${col.nullable ? '' : 'required'}>
            </div>
        `).join('');

    document.getElementById('insert-row-modal').classList.add('active');
}

function getInputType(dataType) {
    switch (dataType) {
        case 'INT':
        case 'FLOAT': return 'number';
        case 'DATE': return 'date';
        case 'TIMESTAMP': return 'datetime-local';
        case 'BOOLEAN': return 'checkbox';
        default: return 'text';
    }
}

async function handleInsertRow(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        const col = tableSchema.columns.find(c => c.name === key);
        if (col) {
            data[key] = convertValue(value, col.dataType);
        }
    }

    // Handle checkboxes (booleans)
    tableSchema.columns.filter(c => c.dataType === 'BOOLEAN').forEach(col => {
        const checkbox = form.querySelector(`input[name="${col.name}"]`);
        if (checkbox) {
            data[col.name] = checkbox.checked;
        }
    });

    try {
        await dbFetch(`/collections/${currentCollection}/tables/${currentTable}/rows`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        utils.showToast('Row inserted!', 'success');
        document.getElementById('insert-row-modal').classList.remove('active');
        form.reset();

        await loadTableData();
        await loadTables();

    } catch (error) {
        utils.showToast(error.message, 'error');
    }
}

function convertValue(value, dataType) {
    if (value === '' || value === null) return null;

    switch (dataType) {
        case 'INT': return parseInt(value);
        case 'FLOAT': return parseFloat(value);
        case 'BOOLEAN': return value === 'true' || value === true || value === '1';
        default: return value;
    }
}

// ============================================
// Edit Row
// ============================================

function editRow(rowId) {
    const row = tableData.find(r => r._rowId === rowId);
    if (!row) return;

    const container = document.getElementById('edit-fields');
    document.getElementById('edit-row-id').value = rowId;

    container.innerHTML = tableSchema.columns
        .filter(col => !col.autoIncrement)
        .map(col => {
            const value = row[col.name];
            const inputType = getInputType(col.dataType);

            if (col.dataType === 'BOOLEAN') {
                return `
                    <div class="form-group">
                        <label class="form-label flex items-center gap-2">
                            <input type="checkbox" name="${col.name}" ${value ? 'checked' : ''}>
                            ${col.name} <span class="text-xs text-gray-400">${col.dataType}</span>
                        </label>
                    </div>
                `;
            }

            return `
                <div class="form-group">
                    <label class="form-label">
                        ${col.name}
                        <span class="text-xs text-gray-400 ml-2">${col.dataType}</span>
                    </label>
                    <input type="${inputType}" class="input font-mono" name="${col.name}" value="${value !== null ? utils.escapeHtml(String(value)) : ''}" ${col.nullable ? '' : 'required'}>
                </div>
            `;
        }).join('');

    document.getElementById('edit-row-modal').classList.add('active');
}

async function handleUpdateRow(e) {
    e.preventDefault();

    const rowId = document.getElementById('edit-row-id').value;
    const form = e.target;
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        const col = tableSchema.columns.find(c => c.name === key);
        if (col) {
            data[key] = convertValue(value, col.dataType);
        }
    }

    // Handle booleans
    tableSchema.columns.filter(c => c.dataType === 'BOOLEAN').forEach(col => {
        const checkbox = form.querySelector(`input[name="${col.name}"]`);
        if (checkbox) {
            data[col.name] = checkbox.checked;
        }
    });

    try {
        await dbFetch(`/collections/${currentCollection}/tables/${currentTable}/rows/${rowId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        utils.showToast('Row updated!', 'success');
        document.getElementById('edit-row-modal').classList.remove('active');

        await loadTableData();

    } catch (error) {
        utils.showToast(error.message, 'error');
    }
}

// ============================================
// Delete Operations
// ============================================

async function deleteRow(rowId) {
    const confirmed = await utils.confirmDialog('Delete this row?', 'Delete Row');
    if (!confirmed) return;

    try {
        await dbFetch(`/collections/${currentCollection}/tables/${currentTable}/rows/${rowId}`, { method: 'DELETE' });
        utils.showToast('Row deleted!', 'success');
        await loadTableData();
        await loadTables();
    } catch (error) {
        utils.showToast(error.message, 'error');
    }
}

async function handleDropTable() {
    if (!currentCollection || !currentTable) return;

    const confirmed = await utils.confirmDialog(
        `Are you sure you want to drop table "${currentTable}"? All data will be permanently deleted.`,
        'Drop Table'
    );
    if (!confirmed) return;

    try {
        await dbFetch(`/collections/${currentCollection}/tables/${currentTable}`, { method: 'DELETE' });

        utils.showToast('Table dropped!', 'success');
        currentTable = null;
        tableSchema = null;
        document.getElementById('table-content').style.display = 'none';
        document.getElementById('no-selection-state').style.display = 'block';

        await loadTables();

    } catch (error) {
        utils.showToast(error.message, 'error');
    }
}

// ============================================
// SQL Editor
// ============================================

async function executeSQL() {
    if (!currentCollection) {
        utils.showToast('Select a collection first', 'info');
        return;
    }

    const sql = document.getElementById('sql-editor').value.trim();
    if (!sql) {
        utils.showToast('Enter a SQL query', 'info');
        return;
    }

    const resultsDiv = document.getElementById('sql-results');
    const queryTypeSpan = document.getElementById('query-type');
    const queryTimeSpan = document.getElementById('query-time');

    resultsDiv.innerHTML = '<div class="p-8 text-center text-gray-500">Executing...</div>';
    queryTypeSpan.textContent = '-';
    queryTimeSpan.textContent = '-';

    try {
        const data = await dbFetch(`/collections/${currentCollection}/sql`, {
            method: 'POST',
            body: JSON.stringify({ sql })
        });

        queryTypeSpan.textContent = data.queryType;
        queryTimeSpan.textContent = data.queryTime;

        // Render results based on query type
        if (data.queryType === 'SELECT' && data.result?.rows) {
            renderSQLResults(data.result.rows, data.result.total);
        } else if (data.queryType === 'SHOW_TABLES' && data.result?.tables) {
            renderTablesResult(data.result.tables);
        } else if (data.queryType === 'DESCRIBE' && data.result?.table) {
            renderDescribeResult(data.result.table);
        } else {
            resultsDiv.innerHTML = `
                <div class="p-4">
                    <div class="bg-green-50 text-green-800 p-4 rounded">
                        <p class="font-medium">Query executed successfully</p>
                        <pre class="mt-2 text-sm">${utils.escapeHtml(JSON.stringify(data.result, null, 2))}</pre>
                    </div>
                </div>
            `;
        }

        // Refresh tables list if structure changed
        if (['CREATE_TABLE', 'DROP_TABLE', 'INSERT', 'UPDATE', 'DELETE'].includes(data.queryType)) {
            await loadTables();
            if (currentTable) await loadTableData();
        }

    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="p-4">
                <div class="bg-red-50 text-red-800 p-4 rounded">
                    <p class="font-medium">Error</p>
                    <p class="mt-1">${utils.escapeHtml(error.message)}</p>
                </div>
            </div>
        `;
        queryTypeSpan.textContent = 'ERROR';
        queryTimeSpan.textContent = '-';
    }
}

function renderSQLResults(rows, total) {
    const resultsDiv = document.getElementById('sql-results');

    if (!rows || rows.length === 0) {
        resultsDiv.innerHTML = '<div class="p-8 text-center text-gray-500">No results</div>';
        return;
    }

    const columns = Object.keys(rows[0]);

    resultsDiv.innerHTML = `
        <div class="p-2 text-sm text-gray-500">${total} rows (showing ${rows.length})</div>
        <table class="data-table">
            <thead>
                <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rows.map(row => `
                    <tr>${columns.map(c => `<td>${formatCellValue(row[c])}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderTablesResult(tables) {
    const resultsDiv = document.getElementById('sql-results');

    resultsDiv.innerHTML = `
        <table class="data-table">
            <thead>
                <tr><th>Table Name</th><th>Rows</th><th>Columns</th></tr>
            </thead>
            <tbody>
                ${tables.map(t => `
                    <tr>
                        <td class="font-mono">${t.name}</td>
                        <td>${t.rowCount}</td>
                        <td>${t.columns?.length || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderDescribeResult(table) {
    const resultsDiv = document.getElementById('sql-results');

    resultsDiv.innerHTML = `
        <table class="data-table">
            <thead>
                <tr><th>Column</th><th>Type</th><th>Nullable</th><th>Key</th><th>Extra</th></tr>
            </thead>
            <tbody>
                ${table.columns.map(c => `
                    <tr>
                        <td class="font-mono">${c.name}</td>
                        <td>${c.dataType}</td>
                        <td>${c.nullable ? 'YES' : 'NO'}</td>
                        <td>${c.primaryKey ? 'PK' : ''}</td>
                        <td>${c.autoIncrement ? 'AUTO_INCREMENT' : ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Export functions
window.renderDatabase = renderDatabase;
window.showCreateCollectionModal = showCreateCollectionModal;
window.showCreateTableModal = showCreateTableModal;
window.editRow = editRow;
window.deleteRow = deleteRow;
