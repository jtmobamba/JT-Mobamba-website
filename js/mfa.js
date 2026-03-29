// MFA Module

let factorId = null;
let challengeId = null;

document.addEventListener('DOMContentLoaded', () => {
    initMFA();
});

async function initMFA() {
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const isSetup = params.get('setup') === 'true';

    // Setup MFA input handlers
    setupMFAInputs();

    if (isSetup) {
        // Show setup view
        showSetupView();
    } else {
        // Check if user needs to verify or setup
        await checkMFAStatus();
    }

    // Setup view switching
    document.getElementById('use-backup-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showBackupView();
    });

    document.getElementById('use-totp-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showVerifyView();
    });

    document.getElementById('skip-mfa-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        skipMFA();
    });

    // Setup forms
    setupVerifyForm();
    setupSetupForm();
    setupBackupForm();
}

async function checkMFAStatus() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const { data: factors, error } = await supabaseClient.auth.mfa.listFactors();
        if (error) throw error;

        if (factors && factors.totp && factors.totp.length > 0) {
            // User has MFA enabled, show verify view
            factorId = factors.totp[0].id;
            showVerifyView();
            await createChallenge();
        } else {
            // User needs to setup MFA
            showSetupView();
            await enrollMFA();
        }
    } catch (error) {
        console.error('MFA status check error:', error);
        window.location.href = 'login.html';
    }
}

async function createChallenge() {
    try {
        const { data, error } = await supabaseClient.auth.mfa.challenge({
            factorId: factorId
        });

        if (error) throw error;
        challengeId = data.id;
    } catch (error) {
        console.error('Challenge creation error:', error);
    }
}

async function enrollMFA() {
    try {
        const { data, error } = await supabaseClient.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: 'Authenticator App'
        });

        if (error) throw error;

        factorId = data.id;

        // Display QR code
        const qrContainer = document.getElementById('qr-code');
        qrContainer.innerHTML = `<img src="${data.totp.qr_code}" alt="QR Code" class="w-48 h-48">`;

        // Display secret
        const secretEl = document.getElementById('mfa-secret');
        secretEl.textContent = data.totp.secret;

        // Copy secret functionality
        document.getElementById('copy-secret').addEventListener('click', () => {
            navigator.clipboard.writeText(data.totp.secret);
            utils.showToast('Secret copied to clipboard', 'success');
        });
    } catch (error) {
        console.error('MFA enrollment error:', error);
        utils.showToast('Failed to setup MFA', 'error');
    }
}

function setupMFAInputs() {
    // Setup all MFA input groups
    const inputGroups = document.querySelectorAll('.mfa-input-group');

    inputGroups.forEach(group => {
        const inputs = group.querySelectorAll('.mfa-input');

        inputs.forEach((input, index) => {
            // Handle input
            input.addEventListener('input', (e) => {
                const value = e.target.value;

                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                // Move to next input
                if (value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                // Auto-submit when all filled
                if (value && index === inputs.length - 1) {
                    const code = Array.from(inputs).map(i => i.value).join('');
                    if (code.length === 6) {
                        const form = group.closest('form');
                        if (form) {
                            form.dispatchEvent(new Event('submit'));
                        }
                    }
                }
            });

            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });

            // Handle paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

                pastedData.split('').forEach((char, i) => {
                    if (inputs[i]) {
                        inputs[i].value = char;
                    }
                });

                // Focus last filled input or next empty one
                const lastIndex = Math.min(pastedData.length, inputs.length) - 1;
                if (lastIndex >= 0) {
                    inputs[lastIndex].focus();
                }

                // Auto-submit if complete
                if (pastedData.length === 6) {
                    const form = group.closest('form');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            });
        });
    });
}

function setupVerifyForm() {
    const form = document.getElementById('mfa-form');
    const errorDiv = document.getElementById('mfa-error');
    const submitBtn = document.getElementById('verify-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const inputs = form.querySelectorAll('.mfa-input');
        const code = Array.from(inputs).map(i => i.value).join('');

        if (code.length !== 6) {
            errorDiv.textContent = 'Please enter a 6-digit code';
            errorDiv.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
        `;

        try {
            // Create challenge if not exists
            if (!challengeId) {
                await createChallenge();
            }

            const { data, error } = await supabaseClient.auth.mfa.verify({
                factorId: factorId,
                challengeId: challengeId,
                code: code
            });

            if (error) throw error;

            // MFA verified successfully
            utils.showToast('Verification successful', 'success');

            // Check onboarding status and redirect
            await redirectAfterAuth();
        } catch (error) {
            console.error('MFA verification error:', error);
            errorDiv.textContent = error.message || 'Invalid code. Please try again.';
            errorDiv.style.display = 'block';

            // Clear inputs
            inputs.forEach(input => input.value = '');
            inputs[0].focus();

            // Create new challenge for next attempt
            await createChallenge();

            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify';
        }
    });
}

function setupSetupForm() {
    const form = document.getElementById('setup-form');
    const errorDiv = document.getElementById('setup-error');
    const submitBtn = document.getElementById('setup-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const inputs = form.querySelectorAll('.setup-input');
        const code = Array.from(inputs).map(i => i.value).join('');

        if (code.length !== 6) {
            errorDiv.textContent = 'Please enter a 6-digit code';
            errorDiv.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enabling...
        `;

        try {
            // Challenge and verify to complete enrollment
            const { data: challengeData, error: challengeError } = await supabaseClient.auth.mfa.challenge({
                factorId: factorId
            });

            if (challengeError) throw challengeError;

            const { data, error } = await supabaseClient.auth.mfa.verify({
                factorId: factorId,
                challengeId: challengeData.id,
                code: code
            });

            if (error) throw error;

            utils.showToast('Two-factor authentication enabled!', 'success');

            // Redirect to onboarding or dashboard
            await redirectAfterAuth();
        } catch (error) {
            console.error('MFA setup error:', error);
            errorDiv.textContent = error.message || 'Invalid code. Please try again.';
            errorDiv.style.display = 'block';

            // Clear inputs
            inputs.forEach(input => input.value = '');
            inputs[0].focus();

            submitBtn.disabled = false;
            submitBtn.textContent = 'Enable two-factor authentication';
        }
    });
}

function setupBackupForm() {
    const form = document.getElementById('backup-form');
    const errorDiv = document.getElementById('backup-error');
    const submitBtn = document.getElementById('backup-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const code = document.getElementById('backup-code').value.replace(/[^a-zA-Z0-9]/g, '');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        try {
            // Note: Supabase doesn't have built-in backup codes
            // This would need to be implemented with a custom solution
            // For now, show an error message
            throw new Error('Backup codes are not yet implemented. Please use your authenticator app.');
        } catch (error) {
            console.error('Backup code error:', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify';
        }
    });
}

async function redirectAfterAuth() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        // Get user profile
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

        if (!profile) {
            // Create profile if it doesn't exist
            await createUserProfile(user);
        }

        if (!profile || !profile.onboarding_completed) {
            window.location.href = 'onboarding.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Redirect error:', error);
        window.location.href = 'dashboard.html';
    }
}

async function createUserProfile(user) {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                username: user.email?.split('@')[0] || 'user',
                role: 'user',
                onboarding_completed: false
            });

        if (error && error.code !== '23505') throw error; // Ignore duplicate key errors

        // Create default workspace
        const { data: workspace, error: wsError } = await supabaseClient
            .from('workspaces')
            .insert({
                name: 'My Workspace',
                owner_id: user.id
            })
            .select()
            .single();

        if (!wsError && workspace) {
            await supabaseClient
                .from('workspace_members')
                .insert({
                    workspace_id: workspace.id,
                    user_id: user.id,
                    role: 'owner'
                });

            localStorage.setItem('currentWorkspaceId', workspace.id);
        }
    } catch (error) {
        console.error('Profile creation error:', error);
    }
}

async function skipMFA() {
    const confirmed = await utils.confirmDialog(
        'Skipping MFA is not recommended. Your account will be less secure. Are you sure?',
        'Skip Two-Factor Authentication'
    );

    if (confirmed) {
        await redirectAfterAuth();
    }
}

function showVerifyView() {
    document.getElementById('verify-view').style.display = 'block';
    document.getElementById('setup-view').style.display = 'none';
    document.getElementById('backup-view').style.display = 'none';

    // Focus first input
    setTimeout(() => {
        document.querySelector('#verify-view .mfa-input')?.focus();
    }, 100);
}

function showSetupView() {
    document.getElementById('verify-view').style.display = 'none';
    document.getElementById('setup-view').style.display = 'block';
    document.getElementById('backup-view').style.display = 'none';
}

function showBackupView() {
    document.getElementById('verify-view').style.display = 'none';
    document.getElementById('setup-view').style.display = 'none';
    document.getElementById('backup-view').style.display = 'block';

    // Focus input
    setTimeout(() => {
        document.getElementById('backup-code')?.focus();
    }, 100);
}
