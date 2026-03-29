// Settings Module

let currentSettingsTab = 'profile';

async function renderSettings(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Settings Sidebar -->
            <div class="lg:col-span-1">
                <div class="card">
                    <div class="card-body p-2">
                        <div class="space-y-1">
                            <div class="settings-nav-item active" data-tab="profile">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                Profile
                            </div>
                            <div class="settings-nav-item" data-tab="security">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                                Security
                            </div>
                            <div class="settings-nav-item" data-tab="workspace">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                Workspace
                            </div>
                            <div class="settings-nav-item" data-tab="notifications">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                </svg>
                                Notifications
                            </div>
                            <div class="settings-nav-item" data-tab="danger">
                                <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                Danger Zone
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings Content -->
            <div class="lg:col-span-3">
                <div id="settings-content"></div>
            </div>
        </div>
    `;

    // Add styles for settings nav
    const style = document.createElement('style');
    style.textContent = `
        .settings-nav-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 0.875rem;
            font-weight: 500;
        }
        .settings-nav-item:hover {
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
        }
        .settings-nav-item.active {
            background: var(--color-bg-secondary);
            color: var(--color-accent);
        }
    `;
    document.head.appendChild(style);

    // Setup tab handlers
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentSettingsTab = item.dataset.tab;
            renderSettingsTab(currentSettingsTab);
        });
    });

    // Render initial tab
    renderSettingsTab('profile');
}

async function renderSettingsTab(tab) {
    const container = document.getElementById('settings-content');

    switch (tab) {
        case 'profile':
            await renderProfileSettings(container);
            break;
        case 'security':
            await renderSecuritySettings(container);
            break;
        case 'workspace':
            await renderWorkspaceSettings(container);
            break;
        case 'notifications':
            renderNotificationSettings(container);
            break;
        case 'danger':
            renderDangerZone(container);
            break;
    }
}

async function renderProfileSettings(container) {
    const user = window.currentUser();
    const profile = user?.profile || {};

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Profile Settings</h3>
            </div>
            <div class="card-body">
                <form id="profile-form">
                    <div class="flex items-center gap-6 mb-6">
                        <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem;">
                            ${(profile.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-medium">${utils.escapeHtml(profile.full_name || 'User')}</h4>
                            <p class="text-sm text-gray-500">${utils.escapeHtml(user?.email || '')}</p>
                            <button type="button" class="btn btn-secondary btn-sm mt-2" id="change-avatar-btn">
                                Change avatar
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Full name</label>
                            <input type="text" class="input" id="profile-name" value="${utils.escapeHtml(profile.full_name || '')}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" class="input" id="profile-username" value="${utils.escapeHtml(profile.username || '')}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="input" value="${utils.escapeHtml(user?.email || '')}" disabled>
                        <p class="form-hint">Email cannot be changed here. Contact support for assistance.</p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <input type="text" class="input" value="${utils.escapeHtml(profile.role || 'user')}" disabled>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" class="btn btn-secondary" id="cancel-profile">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Form handlers
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('profile-name').value;
        const username = document.getElementById('profile-username').value;

        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: username,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local user
            user.profile.full_name = fullName;
            user.profile.username = username;

            // Update UI
            document.getElementById('user-name').textContent = fullName;
            document.getElementById('user-avatar').textContent = fullName.charAt(0).toUpperCase();

            utils.showToast('Profile updated', 'success');
        } catch (error) {
            console.error('Update profile error:', error);
            utils.showToast('Failed to update profile', 'error');
        }
    });

    document.getElementById('change-avatar-btn').addEventListener('click', () => {
        utils.showToast('Avatar upload coming soon!', 'info');
    });
}

async function renderSecuritySettings(container) {
    // Check MFA status
    const { data: factors } = await supabaseClient.auth.mfa.listFactors();
    const hasMFA = factors && factors.totp && factors.totp.length > 0;

    container.innerHTML = `
        <div class="card mb-6">
            <div class="card-header">
                <h3 class="card-title">Two-Factor Authentication</h3>
            </div>
            <div class="card-body">
                <div class="settings-item border-0 p-0">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Authenticator App</div>
                        <div class="settings-item-description">
                            ${hasMFA ? 'Two-factor authentication is enabled' : 'Add an extra layer of security to your account'}
                        </div>
                    </div>
                    ${hasMFA ? `
                        <span class="badge badge-success">Enabled</span>
                    ` : `
                        <button class="btn btn-primary btn-sm" id="enable-mfa-btn">Enable</button>
                    `}
                </div>
            </div>
        </div>

        <div class="card mb-6">
            <div class="card-header">
                <h3 class="card-title">Change Password</h3>
            </div>
            <div class="card-body">
                <form id="password-form">
                    <div class="form-group">
                        <label class="form-label">New password</label>
                        <input type="password" class="input" id="new-password" placeholder="Enter new password" minlength="8">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm new password</label>
                        <input type="password" class="input" id="confirm-password" placeholder="Confirm new password">
                    </div>
                    <button type="submit" class="btn btn-primary">Update password</button>
                </form>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Sessions</h3>
            </div>
            <div class="card-body">
                <div class="settings-item border-0 p-0">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Current Session</div>
                        <div class="settings-item-description">Logged in from this device</div>
                    </div>
                    <span class="badge badge-success">Active</span>
                </div>
                <div class="mt-4">
                    <button class="btn btn-secondary" id="signout-all-btn">Sign out all other devices</button>
                </div>
            </div>
        </div>
    `;

    // Enable MFA
    document.getElementById('enable-mfa-btn')?.addEventListener('click', () => {
        window.location.href = 'mfa.html?setup=true';
    });

    // Password form
    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            utils.showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            utils.showToast('Password must be at least 8 characters', 'error');
            return;
        }

        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            utils.showToast('Password updated successfully', 'success');
            e.target.reset();
        } catch (error) {
            console.error('Update password error:', error);
            utils.showToast(error.message || 'Failed to update password', 'error');
        }
    });

    // Sign out all
    document.getElementById('signout-all-btn').addEventListener('click', async () => {
        const confirmed = await utils.confirmDialog(
            'This will sign you out of all devices. You will need to sign in again.',
            'Sign Out All Devices'
        );

        if (confirmed) {
            try {
                await supabaseClient.auth.signOut({ scope: 'global' });
                window.location.href = 'login.html';
            } catch (error) {
                utils.showToast('Failed to sign out', 'error');
            }
        }
    });
}

async function renderWorkspaceSettings(container) {
    const workspace = window.currentWorkspace();

    container.innerHTML = `
        <div class="card mb-6">
            <div class="card-header">
                <h3 class="card-title">Workspace Settings</h3>
            </div>
            <div class="card-body">
                <form id="workspace-form">
                    <div class="form-group">
                        <label class="form-label">Workspace name</label>
                        <input type="text" class="input" id="workspace-name" value="${utils.escapeHtml(workspace?.name || '')}">
                    </div>
                    <button type="submit" class="btn btn-primary">Save changes</button>
                </form>
            </div>
        </div>

        <div class="card mb-6">
            <div class="card-header">
                <h3 class="card-title">Storage</h3>
            </div>
            <div class="card-body">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm">Storage used</span>
                    <span class="text-sm font-medium">${utils.formatBytes(workspace?.storage_used || 0)} of ${utils.formatBytes(workspace?.storage_limit || MAX_STORAGE_BYTES)}</span>
                </div>
                <div class="storage-bar mb-2">
                    <div class="storage-bar-fill" style="width: ${utils.getStoragePercentage(workspace?.storage_used || 0, workspace?.storage_limit || MAX_STORAGE_BYTES)}%"></div>
                </div>
                <p class="text-xs text-gray-500">${utils.getStoragePercentage(workspace?.storage_used || 0, workspace?.storage_limit || MAX_STORAGE_BYTES)}% used</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Team Members</h3>
                <button class="btn btn-primary btn-sm" id="invite-btn">Invite</button>
            </div>
            <div class="card-body p-0" id="members-container">
                <div class="p-4 text-center text-gray-500">Loading...</div>
            </div>
        </div>
    `;

    // Load members
    await loadWorkspaceMembers();

    // Workspace form
    document.getElementById('workspace-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('workspace-name').value;

        try {
            const { error } = await supabaseClient
                .from('workspaces')
                .update({ name })
                .eq('id', workspace.id);

            if (error) throw error;

            workspace.name = name;
            document.getElementById('current-workspace-name').textContent = name;
            document.getElementById('workspace-icon').textContent = name.charAt(0).toUpperCase();

            utils.showToast('Workspace updated', 'success');
        } catch (error) {
            console.error('Update workspace error:', error);
            utils.showToast('Failed to update workspace', 'error');
        }
    });

    // Invite button
    document.getElementById('invite-btn').addEventListener('click', async () => {
        const email = await utils.promptDialog('Enter email address to invite:', '', 'Invite Member');
        if (email && utils.isValidEmail(email)) {
            utils.showToast('Invitation feature coming soon!', 'info');
        } else if (email) {
            utils.showToast('Please enter a valid email', 'error');
        }
    });
}

async function loadWorkspaceMembers() {
    const container = document.getElementById('members-container');
    const workspace = window.currentWorkspace();

    try {
        const { data: members, error } = await supabaseClient
            .from('workspace_members')
            .select(`
                role,
                user_id,
                profiles (
                    id,
                    full_name,
                    username
                )
            `)
            .eq('workspace_id', workspace.id);

        if (error) throw error;

        if (!members || members.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-gray-500">No members</div>';
            return;
        }

        container.innerHTML = `
            <div class="divide-y divide-gray-100">
                ${members.map(m => `
                    <div class="flex items-center justify-between p-4">
                        <div class="flex items-center gap-3">
                            <div class="user-avatar">${(m.profiles?.full_name || m.profiles?.username || 'U').charAt(0).toUpperCase()}</div>
                            <div>
                                <p class="font-medium text-sm">${utils.escapeHtml(m.profiles?.full_name || m.profiles?.username || 'Unknown')}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <select class="input py-1 px-2 text-sm" data-user-id="${m.user_id}" ${m.role === 'owner' ? 'disabled' : ''}>
                                <option value="owner" ${m.role === 'owner' ? 'selected' : ''}>Owner</option>
                                <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>Admin</option>
                                <option value="member" ${m.role === 'member' ? 'selected' : ''}>Member</option>
                                <option value="viewer" ${m.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                            </select>
                            ${m.role !== 'owner' ? `
                                <button class="btn btn-ghost btn-icon btn-sm text-red-500" data-remove-user="${m.user_id}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Role change handlers
        container.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const userId = e.target.dataset.userId;
                const newRole = e.target.value;

                try {
                    await supabaseClient
                        .from('workspace_members')
                        .update({ role: newRole })
                        .eq('workspace_id', workspace.id)
                        .eq('user_id', userId);

                    utils.showToast('Role updated', 'success');
                } catch (error) {
                    utils.showToast('Failed to update role', 'error');
                }
            });
        });

        // Remove user handlers
        container.querySelectorAll('[data-remove-user]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.removeUser;
                const confirmed = await utils.confirmDialog('Remove this member from the workspace?', 'Remove Member');

                if (confirmed) {
                    try {
                        await supabaseClient
                            .from('workspace_members')
                            .delete()
                            .eq('workspace_id', workspace.id)
                            .eq('user_id', userId);

                        utils.showToast('Member removed', 'success');
                        loadWorkspaceMembers();
                    } catch (error) {
                        utils.showToast('Failed to remove member', 'error');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Load members error:', error);
        container.innerHTML = '<div class="p-4 text-center text-red-500">Failed to load members</div>';
    }
}

function renderNotificationSettings(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Notification Preferences</h3>
            </div>
            <div class="card-body">
                <div class="settings-section">
                    <div class="settings-section-title">Email Notifications</div>

                    <div class="settings-item">
                        <div class="settings-item-info">
                            <div class="settings-item-label">File uploads</div>
                            <div class="settings-item-description">Get notified when files are uploaded</div>
                        </div>
                        <div class="toggle active" id="toggle-uploads">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>

                    <div class="settings-item">
                        <div class="settings-item-info">
                            <div class="settings-item-label">Storage alerts</div>
                            <div class="settings-item-description">Get notified when storage is running low</div>
                        </div>
                        <div class="toggle active" id="toggle-storage">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>

                    <div class="settings-item">
                        <div class="settings-item-info">
                            <div class="settings-item-label">Team updates</div>
                            <div class="settings-item-description">Get notified about team member changes</div>
                        </div>
                        <div class="toggle" id="toggle-team">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">System Notifications</div>

                    <div class="settings-item">
                        <div class="settings-item-info">
                            <div class="settings-item-label">Security alerts</div>
                            <div class="settings-item-description">Get notified about security events</div>
                        </div>
                        <div class="toggle active" id="toggle-security">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>

                    <div class="settings-item">
                        <div class="settings-item-info">
                            <div class="settings-item-label">Product updates</div>
                            <div class="settings-item-description">Get notified about new features</div>
                        </div>
                        <div class="toggle" id="toggle-product">
                            <div class="toggle-handle"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Toggle handlers
    container.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            utils.showToast('Preference saved', 'success');
        });
    });
}

function renderDangerZone(container) {
    container.innerHTML = `
        <div class="card border-red-200">
            <div class="card-header border-red-200">
                <h3 class="card-title text-red-600">Danger Zone</h3>
            </div>
            <div class="card-body">
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Delete Workspace</div>
                        <div class="settings-item-description">Permanently delete this workspace and all its data</div>
                    </div>
                    <button class="btn btn-danger btn-sm" id="delete-workspace-btn">Delete Workspace</button>
                </div>

                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Delete Account</div>
                        <div class="settings-item-description">Permanently delete your account and all associated data</div>
                    </div>
                    <button class="btn btn-danger btn-sm" id="delete-account-btn">Delete Account</button>
                </div>
            </div>
        </div>
    `;

    // Delete workspace
    document.getElementById('delete-workspace-btn').addEventListener('click', async () => {
        const workspace = window.currentWorkspace();
        const confirmed = await utils.confirmDialog(
            `Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`,
            'Delete Workspace'
        );

        if (confirmed) {
            const doubleConfirm = await utils.promptDialog(
                `Type "${workspace.name}" to confirm deletion:`,
                '',
                'Confirm Deletion'
            );

            if (doubleConfirm === workspace.name) {
                try {
                    // Delete all files in workspace
                    const { data: files } = await supabaseClient
                        .from('files')
                        .select('storage_path')
                        .eq('workspace_id', workspace.id);

                    if (files && files.length > 0) {
                        await supabaseClient.storage
                            .from(STORAGE_BUCKET)
                            .remove(files.map(f => f.storage_path));
                    }

                    // Delete workspace (cascades to members, files, etc.)
                    await supabaseClient
                        .from('workspaces')
                        .delete()
                        .eq('id', workspace.id);

                    localStorage.removeItem('currentWorkspaceId');
                    utils.showToast('Workspace deleted', 'success');
                    window.location.reload();
                } catch (error) {
                    console.error('Delete workspace error:', error);
                    utils.showToast('Failed to delete workspace', 'error');
                }
            } else {
                utils.showToast('Workspace name did not match', 'error');
            }
        }
    });

    // Delete account
    document.getElementById('delete-account-btn').addEventListener('click', async () => {
        const confirmed = await utils.confirmDialog(
            'Are you sure you want to delete your account? This will delete all your workspaces and data. This action cannot be undone.',
            'Delete Account'
        );

        if (confirmed) {
            const doubleConfirm = await utils.promptDialog(
                'Type "DELETE" to confirm:',
                '',
                'Confirm Account Deletion'
            );

            if (doubleConfirm === 'DELETE') {
                utils.showToast('Account deletion requires admin action. Please contact support.', 'info');
            } else {
                utils.showToast('Confirmation did not match', 'error');
            }
        }
    });
}

// Export
window.renderSettings = renderSettings;
