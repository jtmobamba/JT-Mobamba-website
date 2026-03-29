/**
 * JT Mobamba API Client
 * Handles all communication with the Node.js/MongoDB backend
 */

// =============================================================================
// API CONFIGURATION
// =============================================================================
// For production: Change PRODUCTION_API_URL to your deployed backend URL
// Example: 'https://jt-mobamba-api.onrender.com/api'

const PRODUCTION_API_URL = 'https://jt-mobamba-api.onrender.com/api';  // UPDATE THIS after deploying backend
const DEVELOPMENT_API_URL = 'http://localhost:5000/api';  // server/server.js runs on port 5000

// Automatically detect environment
const isDevelopment = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.port === '3000';

const API_BASE_URL = isDevelopment ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

// API Client Class
class APIClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.token = localStorage.getItem('jt_auth_token');
    }

    // Get auth headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('jt_auth_token', token);
        } else {
            localStorage.removeItem('jt_auth_token');
        }
    }

    // Generic request handler
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.auth !== false),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // ================== AUTH ==================

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            auth: false
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            auth: false
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.setToken(null);
        }
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    // ================== PRODUCTS ==================

    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products${queryString ? `?${queryString}` : ''}`, {
            auth: false
        });
    }

    async getFeaturedProducts() {
        return this.request('/products/featured', { auth: false });
    }

    async getProductsByCategory(category, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products/category/${category}${queryString ? `?${queryString}` : ''}`, {
            auth: false
        });
    }

    async searchProducts(query, limit = 10) {
        return this.request(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
            auth: false
        });
    }

    async getProduct(productId) {
        return this.request(`/products/${productId}`, { auth: false });
    }

    async getRelatedProducts(productId) {
        return this.request(`/products/${productId}/related`, { auth: false });
    }

    // ================== ORDERS ==================

    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getMyOrders(page = 1, limit = 10) {
        return this.request(`/orders/my-orders?page=${page}&limit=${limit}`);
    }

    async trackOrder(orderNumber, email) {
        return this.request(`/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`, {
            auth: false
        });
    }

    async getOrder(orderNumber) {
        return this.request(`/orders/${orderNumber}`);
    }

    async cancelOrder(orderNumber) {
        return this.request(`/orders/${orderNumber}/cancel`, {
            method: 'PUT'
        });
    }

    // ================== USER ==================

    async updateProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async addAddress(addressData) {
        return this.request('/users/addresses', {
            method: 'POST',
            body: JSON.stringify(addressData)
        });
    }

    async updateAddress(addressId, addressData) {
        return this.request(`/users/addresses/${addressId}`, {
            method: 'PUT',
            body: JSON.stringify(addressData)
        });
    }

    async deleteAddress(addressId) {
        return this.request(`/users/addresses/${addressId}`, {
            method: 'DELETE'
        });
    }

    // ================== WISHLIST ==================

    async getWishlist() {
        return this.request('/users/wishlist');
    }

    async addToWishlist(productId) {
        return this.request(`/users/wishlist/${productId}`, {
            method: 'POST'
        });
    }

    async removeFromWishlist(productId) {
        return this.request(`/users/wishlist/${productId}`, {
            method: 'DELETE'
        });
    }

    // ================== CART ==================

    async getCart() {
        return this.request('/users/cart');
    }

    async addToCart(productId, quantity = 1) {
        return this.request('/users/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    }

    async updateCartItem(productId, quantity) {
        return this.request(`/users/cart/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async removeFromCart(productId) {
        return this.request(`/users/cart/${productId}`, {
            method: 'DELETE'
        });
    }

    async clearCart() {
        return this.request('/users/cart', {
            method: 'DELETE'
        });
    }

    // ================== FILES ==================

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        return data;
    }

    async uploadFiles(files) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const response = await fetch(`${this.baseUrl}/files/upload-multiple`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        return data;
    }

    getFileUrl(fileId) {
        return `${this.baseUrl}/files/${fileId}`;
    }

    async getFileInfo(fileId) {
        return this.request(`/files/${fileId}/info`);
    }

    async getStorageStats() {
        return this.request('/files/storage/stats');
    }

    async deleteFile(fileId) {
        return this.request(`/files/${fileId}`, {
            method: 'DELETE'
        });
    }

    // ================== HEALTH CHECK ==================

    async healthCheck() {
        return this.request('/health', { auth: false });
    }
}

// Create global API instance
const api = new APIClient();

// Auth state management
const authState = {
    user: null,
    isAuthenticated: false,

    async init() {
        const token = localStorage.getItem('jt_auth_token');
        if (token) {
            try {
                const data = await api.getCurrentUser();
                this.user = data.user;
                this.isAuthenticated = true;
                this.updateUI();
            } catch (error) {
                console.log('Session expired');
                api.setToken(null);
            }
        }
    },

    async login(email, password) {
        const data = await api.login(email, password);
        this.user = data.user;
        this.isAuthenticated = true;
        this.updateUI();
        return data;
    },

    async register(userData) {
        const data = await api.register(userData);
        this.user = data.user;
        this.isAuthenticated = true;
        this.updateUI();
        return data;
    },

    async logout() {
        await api.logout();
        this.user = null;
        this.isAuthenticated = false;
        this.updateUI();
    },

    updateUI() {
        // Update UI elements based on auth state
        const signInLinks = document.querySelectorAll('a[href="login.html"]');
        const userMenus = document.querySelectorAll('.user-menu');

        if (this.isAuthenticated && this.user) {
            // Update sign in links to show user name
            signInLinks.forEach(link => {
                if (link.textContent.includes('Sign In')) {
                    link.textContent = this.user.firstName;
                    link.href = 'my-orders.html';
                }
            });
        }
    }
};

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', () => {
    authState.init();
});

// Export for use in other scripts
window.api = api;
window.authState = authState;
