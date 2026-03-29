// Authentication Module

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    // Check if already logged in
    checkSession();

    // Setup form handlers
    setupLoginForm();
    setupSignupForm();
    setupForgotForm();
    setupModals();
    setupCheckbox();
}

// Check existing session
async function checkSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            // Check if MFA is required
            const { data: factors } = await supabaseClient.auth.mfa.listFactors();
            const hasMFA = factors && factors.totp && factors.totp.length > 0;

            if (hasMFA) {
                // Check if current session has completed MFA
                const { data: { currentLevel } } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
                if (currentLevel !== 'aal2') {
                    // Need to complete MFA
                    window.location.href = 'mfa.html';
                    return;
                }
            }

            // Fully authenticated, redirect to dashboard
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

// Setup login form
function setupLoginForm() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
        `;

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Check if MFA is enabled
            const { data: factors } = await supabaseClient.auth.mfa.listFactors();
            const hasMFA = factors && factors.totp && factors.totp.length > 0;

            if (hasMFA) {
                // Redirect to MFA verification
                window.location.href = 'mfa.html';
            } else {
                // Check if this is a new user who should setup MFA
                // For now, redirect to MFA setup
                window.location.href = 'mfa.html?setup=true';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message || 'Failed to sign in';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign in';
        }
    });
}

// Setup signup form
function setupSignupForm() {
    const form = document.getElementById('signup-form');
    const errorDiv = document.getElementById('signup-error');
    const successDiv = document.getElementById('signup-success');
    const submitBtn = document.getElementById('signup-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        // Validate passwords match
        if (password !== confirm) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating account...
        `;

        try {
            // Sign up the user
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });

            if (error) throw error;

            if (data.user && !data.user.confirmed_at) {
                // Email confirmation required
                successDiv.textContent = 'Account created! Please check your email to confirm your account.';
                successDiv.style.display = 'block';
                form.reset();
            } else {
                // Auto-confirmed, create profile and redirect
                await createUserProfile(data.user.id, name, email);
                window.location.href = 'mfa.html?setup=true';
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Create account';
        } catch (error) {
            console.error('Signup error:', error);
            errorDiv.textContent = error.message || 'Failed to create account';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create account';
        }
    });
}

// Create user profile
async function createUserProfile(userId, fullName, email) {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .insert({
                id: userId,
                full_name: fullName,
                username: email.split('@')[0],
                role: 'user',
                onboarding_completed: false
            });

        if (error) throw error;

        // Create default workspace
        const { data: workspace, error: wsError } = await supabaseClient
            .from('workspaces')
            .insert({
                name: 'My Workspace',
                owner_id: userId
            })
            .select()
            .single();

        if (wsError) throw wsError;

        // Add user as workspace member
        await supabaseClient
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: userId,
                role: 'owner'
            });

        // Store workspace ID
        localStorage.setItem('currentWorkspaceId', workspace.id);
    } catch (error) {
        console.error('Profile creation error:', error);
    }
}

// Setup forgot password form
function setupForgotForm() {
    const form = document.getElementById('forgot-form');
    const errorDiv = document.getElementById('forgot-error');
    const successDiv = document.getElementById('forgot-success');
    const submitBtn = document.getElementById('forgot-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        const email = document.getElementById('forgot-email').value;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;

            successDiv.textContent = 'Password reset link sent! Check your email.';
            successDiv.style.display = 'block';
            form.reset();
        } catch (error) {
            console.error('Forgot password error:', error);
            errorDiv.textContent = error.message || 'Failed to send reset link';
            errorDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send reset link';
        }
    });
}

// Setup modals
function setupModals() {
    // Signup modal
    const signupModal = document.getElementById('signup-modal');
    const signupLink = document.getElementById('signup-link');
    const closeSignup = document.getElementById('close-signup');

    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupModal.classList.add('active');
    });

    closeSignup.addEventListener('click', () => {
        signupModal.classList.remove('active');
    });

    // Forgot password modal
    const forgotModal = document.getElementById('forgot-modal');
    const forgotLink = document.getElementById('forgot-password-link');
    const closeForgot = document.getElementById('close-forgot');

    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotModal.classList.add('active');
    });

    closeForgot.addEventListener('click', () => {
        forgotModal.classList.remove('active');
    });

    // Close modals on backdrop click
    [signupModal, forgotModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            signupModal.classList.remove('active');
            forgotModal.classList.remove('active');
        }
    });
}

// Setup remember me checkbox
function setupCheckbox() {
    const checkbox = document.getElementById('remember-check');
    const svg = checkbox.querySelector('svg');

    checkbox.parentElement.addEventListener('click', () => {
        checkbox.classList.toggle('checked');
        svg.style.display = checkbox.classList.contains('checked') ? 'block' : 'none';
    });
}

// Logout function (for use in dashboard)
async function logout() {
    try {
        await supabaseClient.auth.signOut();
        localStorage.removeItem('currentWorkspaceId');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Export for global use
window.logout = logout;
