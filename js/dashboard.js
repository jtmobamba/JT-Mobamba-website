// Dashboard Module

let currentUser = null;
let currentWorkspace = null;
let currentModule = 'overview';

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    // Check authentication using MongoDB API
    const token = localStorage.getItem('jt_auth_token');
    const storedUser = localStorage.getItem('jt_user');

    if (!token || !storedUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Verify token with API
        const userData = await api.getCurrentUser();
        currentUser = userData.user;
    } catch (error) {
        console.error('Auth error:', error);
        // Token might be expired, clear and redirect
        localStorage.removeItem('jt_auth_token');
        localStorage.removeItem('jt_user');
        window.location.href = 'login.html';
        return;
    }

    // Load user profile and workspace
    await loadUserProfile();
    await loadWorkspaces();

    // Setup navigation
    setupNavigation();
    setupUserMenu();
    setupWorkspaceMenu();
    setupMobileMenu();

    // Load initial module
    const hash = window.location.hash.slice(1);
    if (hash) {
        navigateToModule(hash);
    } else {
        navigateToModule('overview');
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash) {
            navigateToModule(hash);
        }
    });

    // Setup real-time subscriptions
    setupRealtimeSubscriptions();
}

async function loadUserProfile() {
    try {
        // Use MongoDB user data
        const name = currentUser.firstName + ' ' + currentUser.lastName || currentUser.email?.split('@')[0] || 'User';
        document.getElementById('user-name').textContent = name;
        document.getElementById('user-email').textContent = currentUser.email;
        document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

async function loadWorkspaces() {
    try {
        // Create default workspace based on user (MongoDB doesn't have workspaces yet)
        const defaultWorkspace = {
            id: currentUser._id,
            name: `${currentUser.firstName}'s Workspace`,
            storage_used: 0,
            storage_limit: 8589934592, // 8GB
            owner_id: currentUser._id,
            role: 'owner'
        };

        currentWorkspace = defaultWorkspace;
        localStorage.setItem('currentWorkspaceId', currentWorkspace.id);
        updateWorkspaceUI(currentWorkspace);

        // Render workspace list with just this workspace
        renderWorkspaceList([defaultWorkspace]);
    } catch (error) {
        console.error('Load workspaces error:', error);
    }
}

function updateWorkspaceUI(workspace) {
    document.getElementById('current-workspace-name').textContent = workspace.name;
    document.getElementById('workspace-icon').textContent = workspace.name.charAt(0).toUpperCase();
}

function renderWorkspaceList(workspaces) {
    const container = document.getElementById('workspace-list');
    container.innerHTML = workspaces.map(ws => `
        <div class="dropdown-item workspace-item ${ws.id === currentWorkspace?.id ? 'active' : ''}" data-workspace-id="${ws.id}">
            <div class="workspace-icon" style="width: 24px; height: 24px; font-size: 0.625rem;">${ws.name.charAt(0).toUpperCase()}</div>
            <span>${utils.escapeHtml(ws.name)}</span>
            ${ws.id === currentWorkspace?.id ? '<svg class="w-4 h-4 ml-auto text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
        </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.workspace-item').forEach(item => {
        item.addEventListener('click', () => {
            const workspaceId = item.dataset.workspaceId;
            const workspace = workspaces.find(w => w.id === workspaceId);
            if (workspace) {
                switchWorkspace(workspace);
            }
        });
    });
}

function switchWorkspace(workspace) {
    currentWorkspace = workspace;
    localStorage.setItem('currentWorkspaceId', workspace.id);
    updateWorkspaceUI(workspace);
    document.getElementById('workspace-menu').style.display = 'none';

    // Reload current module with new workspace context
    navigateToModule(currentModule);
    utils.showToast(`Switched to ${workspace.name}`, 'success');
}

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const module = item.dataset.module;
            if (module) {
                navigateToModule(module);
            }
        });
    });
}

function setupUserMenu() {
    const userMenu = document.getElementById('user-menu');
    const dropdown = document.getElementById('user-dropdown');

    userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        dropdown.style.display = isOpen ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await api.logout();
        } catch (e) {
            // Ignore logout errors
        }
        localStorage.removeItem('jt_auth_token');
        localStorage.removeItem('jt_user');
        localStorage.removeItem('currentWorkspaceId');
        window.location.href = 'login.html';
    });

    // Profile link
    document.getElementById('profile-link').addEventListener('click', () => {
        navigateToModule('settings');
        dropdown.style.display = 'none';
    });

    // Settings link
    document.getElementById('settings-link').addEventListener('click', () => {
        navigateToModule('settings');
        dropdown.style.display = 'none';
    });
}

function setupWorkspaceMenu() {
    const dropdown = document.getElementById('workspace-dropdown');
    const menu = document.getElementById('workspace-menu');

    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.style.display === 'block';
        menu.style.display = isOpen ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        menu.style.display = 'none';
    });

    // Create workspace
    document.getElementById('create-workspace').addEventListener('click', async () => {
        const name = await utils.promptDialog('Enter workspace name:', 'New Workspace', 'Create Workspace');
        if (name) {
            await createWorkspace(name);
        }
        menu.style.display = 'none';
    });
}

async function createWorkspace(name) {
    // Workspaces not yet implemented in MongoDB backend
    utils.showToast('Workspace feature coming soon!', 'info');
}

function setupMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('mobile-menu-btn');

    menuBtn?.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
    });
}

function navigateToModule(module) {
    currentModule = module;
    window.location.hash = module;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.module === module);
    });

    // Update page title
    const titles = {
        overview: 'Overview',
        files: 'File Manager',
        database: 'Database',
        analytics: 'Analytics',
        api: 'API',
        users: 'Users',
        settings: 'Settings'
    };
    document.getElementById('page-title').textContent = titles[module] || module;

    // Close mobile menu
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');

    // Render module content
    renderModule(module);
}

function renderModule(module) {
    const contentArea = document.getElementById('content-area');

    switch (module) {
        case 'overview':
            renderOverview(contentArea);
            break;
        case 'files':
            if (typeof renderFiles === 'function') {
                renderFiles(contentArea);
            }
            break;
        case 'database':
            if (typeof renderDatabase === 'function') {
                renderDatabase(contentArea);
            }
            break;
        case 'analytics':
            if (typeof renderAnalytics === 'function') {
                renderAnalytics(contentArea);
            }
            break;
        case 'api':
            renderAPI(contentArea);
            break;
        case 'users':
            renderUsers(contentArea);
            break;
        case 'settings':
            if (typeof renderSettings === 'function') {
                renderSettings(contentArea);
            }
            break;
        default:
            contentArea.innerHTML = '<div class="empty-state"><p>Module not found</p></div>';
    }
}

async function renderOverview(container) {
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon orange">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                </div>
                <div class="stat-value" id="stat-files">-</div>
                <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                </div>
                <div class="stat-value" id="stat-storage">-</div>
                <div class="stat-label">Storage Used</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                </div>
                <div class="stat-value" id="stat-members">-</div>
                <div class="stat-label">Team Members</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                </div>
                <div class="stat-value" id="stat-sync">Synced</div>
                <div class="stat-label">Sync Status</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Storage Overview -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Storage Overview</h3>
                </div>
                <div class="card-body">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-600" id="storage-used-label">0 bytes used</span>
                        <span class="text-sm text-gray-600" id="storage-total-label">of 8 GB</span>
                    </div>
                    <div class="storage-bar">
                        <div class="storage-bar-fill" id="storage-bar-fill" style="width: 0%"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-2" id="storage-percent">0% used</p>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Activity</h3>
                </div>
                <div class="card-body" id="recent-activity">
                    <div class="empty-state py-8">
                        <p class="text-gray-500 text-sm">No recent activity</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="card mt-6">
            <div class="card-header">
                <h3 class="card-title">Quick Actions</h3>
            </div>
            <div class="card-body">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button class="btn btn-secondary" onclick="navigateToModule('files')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        Upload Files
                    </button>
                    <button class="btn btn-secondary" onclick="navigateToModule('database')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        New Table
                    </button>
                    <button class="btn btn-secondary" onclick="navigateToModule('analytics')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        View Analytics
                    </button>
                    <button class="btn btn-secondary" onclick="navigateToModule('settings')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                        Invite Member
                    </button>
                </div>
            </div>
        </div>
    `;

    // Load stats
    loadOverviewStats();
}

async function loadOverviewStats() {
    if (!currentWorkspace) return;

    try {
        // Get storage stats from MongoDB API
        let storageStats = { fileCount: 0, totalSize: 0 };
        try {
            storageStats = await api.getStorageStats();
        } catch (e) {
            console.log('Storage stats not available');
        }

        // Update UI
        document.getElementById('stat-files').textContent = storageStats.fileCount || 0;
        document.getElementById('stat-members').textContent = 1;

        // Storage
        const storageUsed = storageStats.totalSize || 0;
        const storageLimit = currentWorkspace.storage_limit || 8589934592;
        const percentage = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

        document.getElementById('stat-storage').textContent = utils.formatBytes(storageUsed);
        document.getElementById('storage-used-label').textContent = `${utils.formatBytes(storageUsed)} used`;
        document.getElementById('storage-total-label').textContent = `of ${utils.formatBytes(storageLimit)}`;
        document.getElementById('storage-percent').textContent = `${percentage}% used`;

        const storageBar = document.getElementById('storage-bar-fill');
        storageBar.style.width = `${percentage}%`;
        if (percentage > 90) {
            storageBar.classList.add('danger');
        } else if (percentage > 70) {
            storageBar.classList.add('warning');
        }

        // Load recent activity (skip for now - needs MongoDB implementation)
        document.getElementById('recent-activity').innerHTML = `
            <div class="empty-state py-8">
                <p class="text-gray-500 text-sm">No recent activity</p>
            </div>
        `;
    } catch (error) {
        console.error('Load overview stats error:', error);
    }
}

async function loadRecentActivity() {
    try {
        const { data: events, error } = await supabaseClient
            .from('sync_events')
            .select(`
                *,
                files (name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        const container = document.getElementById('recent-activity');
        if (!events || events.length === 0) {
            container.innerHTML = `
                <div class="empty-state py-8">
                    <p class="text-gray-500 text-sm">No recent activity</p>
                </div>
            `;
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    ${getEventIcon(event.event_type)}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">${utils.escapeHtml(event.files?.name || 'Unknown file')}</p>
                    <p class="text-xs text-gray-500">${event.event_type} - ${utils.formatDate(event.created_at)}</p>
                </div>
                <span class="badge ${event.status === 'success' ? 'badge-success' : 'badge-error'}">${event.status}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load recent activity error:', error);
    }
}

function getEventIcon(eventType) {
    const icons = {
        upload: '<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>',
        delete: '<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>',
        rename: '<svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>',
        move: '<svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>'
    };
    return icons[eventType] || icons.upload;
}

function renderAPI(container) {
    // Use the new API Keys Module
    if (typeof APIKeysModule !== 'undefined') {
        container.innerHTML = APIKeysModule.renderContent();
        APIKeysModule.init();
    } else {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">API Configuration</h3>
                </div>
                <div class="card-body">
                    <div class="empty-state">
                        <p>API module is loading...</p>
                    </div>
                </div>
            </div>
        `;
    }
}

async function renderUsers(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Team Members</h3>
                <button class="btn btn-primary btn-sm" id="invite-member-btn">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                    Invite
                </button>
            </div>
            <div class="card-body p-0">
                <div id="members-list" class="divide-y divide-gray-100">
                    <div class="flex items-center justify-between p-4">
                        <div class="flex items-center gap-3">
                            <div class="user-avatar">${currentUser.firstName.charAt(0).toUpperCase()}</div>
                            <div>
                                <p class="font-medium text-sm">${currentUser.firstName} ${currentUser.lastName}</p>
                                <p class="text-xs text-gray-500">${currentUser.email}</p>
                            </div>
                        </div>
                        <span class="badge badge-neutral">owner</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Invite button (placeholder)
    document.getElementById('invite-member-btn').addEventListener('click', async () => {
        utils.showToast('Team invitation feature coming soon!', 'info');
    });
}

function setupRealtimeSubscriptions() {
    // Real-time subscriptions not implemented with MongoDB
    // Could be added later with Socket.IO or similar
    console.log('Real-time subscriptions not available with MongoDB backend');
}

// Export for global use
window.navigateToModule = navigateToModule;
window.currentWorkspace = () => currentWorkspace;
window.currentUser = () => currentUser;
