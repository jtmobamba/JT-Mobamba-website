// Onboarding Module

let currentStep = 0;
const totalSteps = 5;

document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
});

async function initOnboarding() {
    // Check auth
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Check if onboarding already completed
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

    if (profile && profile.onboarding_completed) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Setup event listeners
    setupNavigation();
    updateProgressDots();
}

function setupNavigation() {
    // Start tour button
    document.getElementById('start-tour')?.addEventListener('click', () => {
        goToStep(1);
    });

    // Skip onboarding buttons
    document.getElementById('skip-onboarding')?.addEventListener('click', skipOnboarding);
    document.getElementById('skip-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        skipOnboarding();
    });

    // Navigation buttons
    document.querySelectorAll('[data-action="next"]').forEach(btn => {
        btn.addEventListener('click', () => goToStep(currentStep + 1));
    });

    document.querySelectorAll('[data-action="prev"]').forEach(btn => {
        btn.addEventListener('click', () => goToStep(currentStep - 1));
    });

    // Complete onboarding
    document.getElementById('complete-onboarding')?.addEventListener('click', completeOnboarding);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' && currentStep < totalSteps - 1) {
            goToStep(currentStep + 1);
        } else if (e.key === 'ArrowLeft' && currentStep > 0) {
            goToStep(currentStep - 1);
        } else if (e.key === 'Enter' && currentStep === totalSteps - 1) {
            completeOnboarding();
        }
    });

    // Progress dot clicks
    document.querySelectorAll('.progress-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const step = parseInt(dot.dataset.step);
            if (step <= currentStep + 1) {
                goToStep(step);
            }
        });
    });
}

function goToStep(step) {
    if (step < 0 || step >= totalSteps) return;

    // Hide current step
    const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
    if (currentStepEl) {
        currentStepEl.style.display = 'none';
    }

    // Show new step
    currentStep = step;
    const newStepEl = document.querySelector(`[data-step="${currentStep}"]`);
    if (newStepEl) {
        newStepEl.style.display = 'block';
        // Animate entrance
        newStepEl.style.opacity = '0';
        newStepEl.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
            newStepEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            newStepEl.style.opacity = '1';
            newStepEl.style.transform = 'translateY(0)';
        });
    }

    updateProgressDots();
}

function updateProgressDots() {
    document.querySelectorAll('.progress-dot').forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index === currentStep) {
            dot.classList.add('active');
        } else if (index < currentStep) {
            dot.classList.add('completed');
        }
    });
}

async function skipOnboarding() {
    const confirmed = await utils.confirmDialog(
        'Are you sure you want to skip the tour? You can always access help from the dashboard.',
        'Skip Tour'
    );

    if (confirmed) {
        await markOnboardingComplete();
        window.location.href = 'dashboard.html';
    }
}

async function completeOnboarding() {
    const btn = document.getElementById('complete-onboarding');
    btn.disabled = true;
    btn.innerHTML = `
        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Setting up...
    `;

    try {
        // Update workspace name if changed
        const workspaceName = document.getElementById('workspace-name').value.trim() || 'My Workspace';
        const workspaceId = localStorage.getItem('currentWorkspaceId');

        if (workspaceId) {
            await supabaseClient
                .from('workspaces')
                .update({ name: workspaceName })
                .eq('id', workspaceId);
        }

        // Mark onboarding as complete
        await markOnboardingComplete();

        utils.showToast('Welcome to JT-Mobamba!', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    } catch (error) {
        console.error('Complete onboarding error:', error);
        utils.showToast('Something went wrong. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Complete setup
        `;
    }
}

async function markOnboardingComplete() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    await supabaseClient
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
}
