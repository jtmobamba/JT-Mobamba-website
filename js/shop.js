// JT Mobamba Shop - Shopify Integration
// This file handles cart management and Shopify checkout integration

// =============================================================================
// SHOPIFY CONFIGURATION
// =============================================================================
// To use Shopify payments, you need to:
// 1. Create a Shopify store at shopify.com
// 2. Create a private app in Shopify Admin > Apps > Develop apps
// 3. Enable Storefront API access
// 4. Replace these placeholder values with your actual credentials

const SHOPIFY_CONFIG = {
    domain: 'your-store.myshopify.com', // Replace with your Shopify store domain
    storefrontAccessToken: 'your-storefront-access-token', // Replace with your token
    apiVersion: '2024-01' // Shopify API version
};

// =============================================================================
// CART STATE MANAGEMENT
// =============================================================================

class Cart {
    constructor() {
        this.items = [];
        this.checkoutId = null;
        this.checkoutUrl = null;
        this.loadFromStorage();
    }

    // Load cart from localStorage
    loadFromStorage() {
        try {
            const savedCart = localStorage.getItem('jt_mobamba_cart');
            if (savedCart) {
                const data = JSON.parse(savedCart);
                this.items = data.items || [];
                this.checkoutId = data.checkoutId || null;
            }
        } catch (e) {
            console.error('Error loading cart:', e);
            this.items = [];
        }
        this.updateCartUI();
    }

    // Save cart to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('jt_mobamba_cart', JSON.stringify({
                items: this.items,
                checkoutId: this.checkoutId
            }));
        } catch (e) {
            console.error('Error saving cart:', e);
        }
    }

    // Add item to cart
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            this.items.push({
                id: product.id,
                variantId: product.variantId || product.id, // Shopify variant ID
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: product.quantity || 1
            });
        }

        this.saveToStorage();
        this.updateCartUI();
        this.showNotification(`${product.title} added to cart!`);
        return true;
    }

    // Remove item from cart
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.updateCartUI();
    }

    // Update item quantity
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
                this.updateCartUI();
            }
        }
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Get item count
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Clear cart
    clear() {
        this.items = [];
        this.checkoutId = null;
        this.checkoutUrl = null;
        this.saveToStorage();
        this.updateCartUI();
    }

    // Update cart UI elements
    updateCartUI() {
        // Update cart count badge
        const cartBadges = document.querySelectorAll('.cart-count');
        const count = this.getItemCount();
        cartBadges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });

        // Update cart sidebar/modal if it exists
        this.renderCartSidebar();
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all duration-300 translate-y-20 opacity-0 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-y-20', 'opacity-0');
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Render cart sidebar
    renderCartSidebar() {
        const cartSidebar = document.getElementById('cart-sidebar-content');
        if (!cartSidebar) return;

        if (this.items.length === 0) {
            cartSidebar.innerHTML = `
                <div class="flex flex-col items-center justify-center h-64 text-gray-500">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                    <p class="text-lg font-medium">Your cart is empty</p>
                    <p class="text-sm">Add some products to get started!</p>
                </div>
            `;
            return;
        }

        const itemsHtml = this.items.map(item => `
            <div class="flex gap-4 p-4 border-b border-gray-100" data-item-id="${item.id}">
                <div class="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    <img src="${item.image}" alt="${item.title}" class="w-full h-full object-contain">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 truncate">${item.title}</h4>
                    <p class="text-jt-red-600 font-bold">£${item.price.toFixed(2)}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <button onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})"
                                class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                            </svg>
                        </button>
                        <span class="w-8 text-center font-medium">${item.quantity}</span>
                        <button onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})"
                                class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                        </button>
                        <button onclick="cart.removeItem('${item.id}')"
                                class="ml-auto text-gray-400 hover:text-red-500">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        cartSidebar.innerHTML = itemsHtml;

        // Update total
        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) {
            cartTotal.textContent = `£${this.getTotal().toFixed(2)}`;
        }
    }
}

// =============================================================================
// SHOPIFY BUY SDK INTEGRATION
// =============================================================================

class ShopifyCheckout {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.checkout = null;
    }

    // Initialize Shopify Buy SDK
    async initialize() {
        // Load Shopify Buy SDK if not already loaded
        if (typeof ShopifyBuy === 'undefined') {
            await this.loadSDK();
        }

        try {
            this.client = ShopifyBuy.buildClient({
                domain: this.config.domain,
                storefrontAccessToken: this.config.storefrontAccessToken,
                apiVersion: this.config.apiVersion
            });
            console.log('Shopify client initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Shopify client:', error);
            return false;
        }
    }

    // Load Shopify Buy SDK dynamically
    loadSDK() {
        return new Promise((resolve, reject) => {
            if (typeof ShopifyBuy !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Create a new checkout
    async createCheckout(cartItems) {
        if (!this.client) {
            console.error('Shopify client not initialized');
            return null;
        }

        try {
            // Create line items from cart
            const lineItems = cartItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            }));

            // Create checkout
            this.checkout = await this.client.checkout.create();

            // Add line items to checkout
            this.checkout = await this.client.checkout.addLineItems(
                this.checkout.id,
                lineItems
            );

            return this.checkout;
        } catch (error) {
            console.error('Failed to create checkout:', error);
            return null;
        }
    }

    // Update checkout with new items
    async updateCheckout(checkoutId, cartItems) {
        if (!this.client) return null;

        try {
            const lineItems = cartItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            }));

            this.checkout = await this.client.checkout.replaceLineItems(
                checkoutId,
                lineItems
            );

            return this.checkout;
        } catch (error) {
            console.error('Failed to update checkout:', error);
            return null;
        }
    }

    // Redirect to Shopify checkout
    redirectToCheckout() {
        if (this.checkout && this.checkout.webUrl) {
            window.location.href = this.checkout.webUrl;
        } else {
            console.error('No checkout URL available');
        }
    }

    // Get checkout URL
    getCheckoutUrl() {
        return this.checkout ? this.checkout.webUrl : null;
    }
}

// =============================================================================
// ALTERNATIVE: STRIPE CHECKOUT INTEGRATION
// =============================================================================
// If you prefer to use Stripe instead of Shopify, here's the integration

class StripeCheckout {
    constructor(publicKey) {
        this.publicKey = publicKey;
        this.stripe = null;
    }

    // Initialize Stripe
    async initialize() {
        if (typeof Stripe === 'undefined') {
            await this.loadStripe();
        }
        this.stripe = Stripe(this.publicKey);
        return true;
    }

    // Load Stripe.js
    loadStripe() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Create checkout session (requires backend endpoint)
    async createCheckoutSession(cartItems) {
        try {
            // This requires a backend endpoint to create the session
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: item.title,
                                images: [item.image],
                            },
                            unit_amount: Math.round(item.price * 100), // Stripe uses cents
                        },
                        quantity: item.quantity,
                    })),
                }),
            });

            const session = await response.json();
            return session;
        } catch (error) {
            console.error('Failed to create checkout session:', error);
            return null;
        }
    }

    // Redirect to Stripe Checkout
    async redirectToCheckout(sessionId) {
        if (!this.stripe) return;

        const { error } = await this.stripe.redirectToCheckout({
            sessionId: sessionId
        });

        if (error) {
            console.error('Stripe redirect error:', error);
        }
    }
}

// =============================================================================
// PRODUCT DATA (Demo products - replace with real Shopify products)
// =============================================================================

const DEMO_PRODUCTS = [
    {
        id: 'prod_001',
        variantId: 'gid://shopify/ProductVariant/1234567890',
        title: 'Premium Wireless Earbuds',
        price: 89.99,
        originalPrice: 119.99,
        discount: 25,
        image: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 4,
        reviews: 128,
        badge: 'sale',
        category: 'audio'
    },
    {
        id: 'prod_002',
        variantId: 'gid://shopify/ProductVariant/1234567891',
        title: 'Smart Watch Pro X',
        price: 299.99,
        image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 5,
        reviews: 256,
        badge: 'new',
        category: 'wearables'
    },
    {
        id: 'prod_003',
        variantId: 'gid://shopify/ProductVariant/1234567892',
        title: 'Portable Bluetooth Speaker',
        price: 59.99,
        originalPrice: 69.99,
        discount: 15,
        image: 'https://images.pexels.com/photos/1279365/pexels-photo-1279365.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 4,
        reviews: 89,
        badge: 'sale',
        category: 'audio'
    },
    {
        id: 'prod_004',
        variantId: 'gid://shopify/ProductVariant/1234567893',
        title: 'MacBook Pro 16"',
        price: 2499.99,
        image: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 5,
        reviews: 512,
        badge: 'bestseller',
        category: 'laptops'
    },
    {
        id: 'prod_005',
        variantId: 'gid://shopify/ProductVariant/1234567894',
        title: 'Ultra HD 4K Webcam',
        price: 129.99,
        originalPrice: 159.99,
        discount: 20,
        image: 'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 4,
        reviews: 203,
        badge: 'sale',
        category: 'cameras'
    },
    {
        id: 'prod_006',
        variantId: 'gid://shopify/ProductVariant/1234567895',
        title: 'iPhone 15 Pro',
        price: 999.99,
        image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 5,
        reviews: 445,
        badge: 'new',
        category: 'smartphones'
    },
    {
        id: 'prod_007',
        variantId: 'gid://shopify/ProductVariant/1234567896',
        title: 'Noise Cancelling Headphones',
        price: 249.99,
        originalPrice: 299.99,
        discount: 17,
        image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 5,
        reviews: 678,
        badge: 'bestseller',
        category: 'audio'
    },
    {
        id: 'prod_008',
        variantId: 'gid://shopify/ProductVariant/1234567897',
        title: 'Smart Home Hub',
        price: 149.99,
        image: 'https://images.pexels.com/photos/4219883/pexels-photo-4219883.jpeg?auto=compress&cs=tinysrgb&w=400',
        rating: 4,
        reviews: 156,
        category: 'smart-home'
    }
];

// =============================================================================
// INITIALIZE CART AND SHOPIFY
// =============================================================================

// Global cart instance
const cart = new Cart();

// Shopify checkout instance
const shopifyCheckout = new ShopifyCheckout(SHOPIFY_CONFIG);

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Shopify (comment out if not using Shopify)
    // await shopifyCheckout.initialize();

    // Setup event listeners for add to cart buttons
    setupAddToCartButtons();

    // Setup cart sidebar toggle
    setupCartSidebar();
});

// Setup add to cart buttons
function setupAddToCartButtons() {
    document.querySelectorAll('[data-add-to-cart]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = button.dataset.productId;
            const product = DEMO_PRODUCTS.find(p => p.id === productId);

            if (product) {
                cart.addItem(product);
            }
        });
    });
}

// Setup cart sidebar
function setupCartSidebar() {
    const cartToggle = document.getElementById('cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartClose = document.getElementById('cart-close');
    const cartOverlay = document.getElementById('cart-overlay');

    if (cartToggle && cartSidebar) {
        cartToggle.addEventListener('click', () => {
            cartSidebar.classList.add('active');
            if (cartOverlay) cartOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    if (cartClose && cartSidebar) {
        cartClose.addEventListener('click', closeCartSidebar);
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartSidebar);
    }

    function closeCartSidebar() {
        if (cartSidebar) cartSidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Checkout function
async function proceedToCheckout() {
    if (cart.items.length === 0) {
        cart.showNotification('Your cart is empty!', 'error');
        return;
    }

    // Show loading state
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = `
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        `;
    }

    try {
        // Option 1: Use Shopify Checkout
        if (shopifyCheckout.client) {
            const checkout = await shopifyCheckout.createCheckout(cart.items);
            if (checkout) {
                shopifyCheckout.redirectToCheckout();
                return;
            }
        }

        // Option 2: Redirect to local checkout page
        window.location.href = 'checkout.html';

    } catch (error) {
        console.error('Checkout error:', error);
        cart.showNotification('Checkout failed. Please try again.', 'error');
    } finally {
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Proceed to Checkout';
        }
    }
}

// Export for global access
window.cart = cart;
window.shopifyCheckout = shopifyCheckout;
window.DEMO_PRODUCTS = DEMO_PRODUCTS;
window.proceedToCheckout = proceedToCheckout;
