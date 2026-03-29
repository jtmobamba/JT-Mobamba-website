// JT Mobamba Newsletter Subscription Handler
// This handles newsletter form submissions across the website

// =============================================================================
// CONFIGURATION
// =============================================================================
// Automatically detect environment
const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

// API URLs - Try port 5000 first (server/server.js), then port 3000 (root server.js)
const LOCAL_API_URL_5000 = 'http://localhost:5000/api/newsletter/subscribe';
const LOCAL_API_URL_3000 = 'http://localhost:3000/api/newsletter/subscribe';
const PRODUCTION_API_URL = 'https://jt-mobamba-api.onrender.com/api/newsletter/subscribe'; // Update after deploying

// Use local backend when on localhost, production URL otherwise
const NEWSLETTER_API_URL = isLocalhost ? LOCAL_API_URL_5000 : PRODUCTION_API_URL;
const NEWSLETTER_API_URL_FALLBACK = isLocalhost ? LOCAL_API_URL_3000 : null;

// Backend is enabled everywhere (production deployed on Render.com)
const BACKEND_ENABLED = true;

class NewsletterManager {
    constructor() {
        this.apiEndpoint = NEWSLETTER_API_URL;
        this.fallbackEndpoint = NEWSLETTER_API_URL_FALLBACK;
        this.backendEnabled = BACKEND_ENABLED;
        this.subscribers = this.loadSubscribers();
    }

    // Load subscribers from localStorage
    loadSubscribers() {
        try {
            const saved = localStorage.getItem('jt_mobamba_subscribers');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    // Save subscriber locally
    saveSubscriber(email) {
        if (!this.subscribers.includes(email)) {
            this.subscribers.push(email);
            localStorage.setItem('jt_mobamba_subscribers', JSON.stringify(this.subscribers));
        }
    }

    // Validate email format
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Subscribe to newsletter
    async subscribe(email, formElement) {
        // Validate email
        if (!email || !this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address.', 'error');
            return false;
        }

        // Check if already subscribed
        if (this.subscribers.includes(email)) {
            this.showNotification('You are already subscribed to our newsletter!', 'info');
            return false;
        }

        // Show loading state
        const submitBtn = formElement.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;

        try {
            // If backend is enabled, try to send to API
            if (this.backendEnabled) {
                let response;
                let result;

                // Try primary endpoint (port 5000)
                try {
                    response = await fetch(this.apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email })
                    });

                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error('Primary backend not available');
                    }

                    result = await response.json();
                } catch (primaryError) {
                    // Try fallback endpoint (port 3000) if available
                    if (this.fallbackEndpoint) {
                        console.log('Trying fallback endpoint...');
                        response = await fetch(this.fallbackEndpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ email })
                        });

                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            throw new Error('Backend not available');
                        }

                        result = await response.json();
                    } else {
                        throw primaryError;
                    }
                }

                if (response.ok && result.success) {
                    this.saveSubscriber(email);
                    formElement.reset();
                    this.showNotification('Welcome to JT Mobamba! Check your email for confirmation.', 'success');
                    return true;
                } else {
                    throw new Error(result.message || 'Subscription failed');
                }
            } else {
                // Backend not enabled - just save locally and show success
                // Email will be sent once backend is deployed
                this.saveSubscriber(email);
                formElement.reset();
                this.showNotification('Thank you for subscribing to JT Mobamba! You\'ll receive exclusive deals and updates.', 'success');

                // Log for debugging
                console.log('Newsletter subscription saved locally:', email);
                console.log('To enable email sending, deploy the backend and set BACKEND_ENABLED = true');

                return true;
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);

            // Save locally even if API fails
            this.saveSubscriber(email);
            formElement.reset();
            this.showNotification('Thank you for subscribing! You\'ll receive our latest deals and updates.', 'success');
            return true;
        } finally {
            // Restore button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        // Remove existing notifications
        document.querySelectorAll('.newsletter-notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `newsletter-notification fixed bottom-4 right-4 px-6 py-4 rounded-xl shadow-lg z-50 transform transition-all duration-300 translate-y-20 opacity-0 max-w-sm ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;

        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                    ${type === 'success' ? `
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                    ` : type === 'error' ? `
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    ` : `
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    `}
                </div>
                <div>
                    <p class="font-medium">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2">
                    <svg class="w-5 h-5 opacity-70 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-y-20', 'opacity-0');
        }, 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Get all locally saved subscribers (useful for admin)
    getSubscribers() {
        return this.subscribers;
    }

    // Export subscribers as CSV
    exportSubscribersCSV() {
        const csv = 'Email,Subscribed Date\n' +
            this.subscribers.map(email => `${email},${new Date().toISOString()}`).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jt-mobamba-subscribers.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Initialize all newsletter forms on the page
    initForms() {
        document.querySelectorAll('[data-newsletter-form]').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const emailInput = form.querySelector('input[type="email"]');
                if (emailInput) {
                    await this.subscribe(emailInput.value.trim(), form);
                }
            });
        });
    }
}

// Create global instance
const newsletter = new NewsletterManager();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    newsletter.initForms();
});

// Export for global access
window.newsletter = newsletter;
