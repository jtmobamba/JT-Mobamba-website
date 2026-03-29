/**
 * JT Mobamba - Active Search & AI Chat Integration
 * Provides real-time search functionality and AI chatbot
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = 'http://localhost:5000/api';

// =============================================================================
// SEARCH FUNCTIONALITY
// =============================================================================

class SearchEngine {
    constructor() {
        this.searchInput = null;
        this.searchResults = null;
        this.searchOverlay = null;
        this.debounceTimer = null;
        this.isOpen = false;
    }

    init() {
        this.createSearchUI();
        this.bindEvents();
    }

    createSearchUI() {
        // Create search overlay
        const overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-modal">
                <div class="search-header">
                    <div class="search-input-wrapper">
                        <svg class="search-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" id="search-modal-input" class="search-modal-input" placeholder="Search products..." autocomplete="off">
                        <button class="search-close-btn" id="search-close">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="search-body">
                    <div id="search-results" class="search-results">
                        <div class="search-placeholder">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <p>Start typing to search products...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.searchOverlay = overlay;
        this.searchInput = document.getElementById('search-modal-input');
        this.searchResults = document.getElementById('search-results');

        // Add styles
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .search-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 10vh;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
                z-index: 9999;
            }
            .search-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            .search-modal {
                background: #FFFFFF;
                border-radius: 16px;
                width: 100%;
                max-width: 600px;
                max-height: 70vh;
                overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                transform: translateY(-20px);
                transition: transform 0.2s ease;
            }
            .search-overlay.active .search-modal {
                transform: translateY(0);
            }
            .search-header {
                padding: 1rem;
                border-bottom: 1px solid #E5E5E5;
            }
            .search-input-wrapper {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                background: #FFF8F0;
                border-radius: 12px;
                padding: 0.75rem 1rem;
            }
            .search-input-icon {
                width: 20px;
                height: 20px;
                color: #9CA3AF;
                flex-shrink: 0;
            }
            .search-modal-input {
                flex: 1;
                border: none;
                background: transparent;
                font-size: 1rem;
                color: #1A1A1A;
                outline: none;
            }
            .search-modal-input::placeholder {
                color: #9CA3AF;
            }
            .search-close-btn {
                background: none;
                border: none;
                color: #9CA3AF;
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            .search-close-btn:hover {
                background: #E5E5E5;
                color: #1A1A1A;
            }
            .search-body {
                max-height: calc(70vh - 80px);
                overflow-y: auto;
            }
            .search-results {
                padding: 1rem;
            }
            .search-placeholder {
                text-align: center;
                padding: 3rem;
                color: #9CA3AF;
            }
            .search-placeholder svg {
                margin-bottom: 1rem;
            }
            .search-placeholder p {
                font-size: 0.875rem;
            }
            .search-result-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.875rem;
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .search-result-item:hover {
                background: #FFF8F0;
            }
            .search-result-image {
                width: 56px;
                height: 56px;
                background: #F5F4F1;
                border-radius: 10px;
                overflow: hidden;
                flex-shrink: 0;
            }
            .search-result-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .search-result-info {
                flex: 1;
                min-width: 0;
            }
            .search-result-title {
                font-weight: 500;
                color: #1A1A1A;
                margin-bottom: 0.25rem;
            }
            .search-result-category {
                font-size: 0.75rem;
                color: #9CA3AF;
                text-transform: capitalize;
            }
            .search-result-price {
                font-weight: 600;
                color: #C4815D;
            }
            .search-no-results {
                text-align: center;
                padding: 2rem;
                color: #6B6B6B;
            }
            .search-no-results svg {
                margin-bottom: 1rem;
                color: #9CA3AF;
            }
            .search-loading {
                display: flex;
                justify-content: center;
                padding: 2rem;
            }
            .search-loading-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #E5E5E5;
                border-top-color: #C4815D;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Open search on click
        const searchTriggers = document.querySelectorAll('[data-search-trigger], .search-input, #global-search');
        searchTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
            trigger.addEventListener('focus', (e) => {
                e.preventDefault();
                this.open();
            });
        });

        // Close on overlay click
        this.searchOverlay.addEventListener('click', (e) => {
            if (e.target === this.searchOverlay) {
                this.close();
            }
        });

        // Close button
        document.getElementById('search-close').addEventListener('click', () => {
            this.close();
        });

        // Input handling with debounce
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.search(e.target.value);
            }, 300);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Open with Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.open();
            }
            // Close with Escape
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        this.searchOverlay.classList.add('active');
        this.isOpen = true;
        this.searchInput.focus();
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.searchOverlay.classList.remove('active');
        this.isOpen = false;
        this.searchInput.value = '';
        document.body.style.overflow = '';
        this.showPlaceholder();
    }

    showPlaceholder() {
        this.searchResults.innerHTML = `
            <div class="search-placeholder">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <p>Start typing to search products...</p>
            </div>
        `;
    }

    showLoading() {
        this.searchResults.innerHTML = `
            <div class="search-loading">
                <div class="search-loading-spinner"></div>
            </div>
        `;
    }

    async search(query) {
        if (!query.trim()) {
            this.showPlaceholder();
            return;
        }

        this.showLoading();

        try {
            // Try API first
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                this.renderResults(data.results, query);
                return;
            }
        } catch (error) {
            console.log('API not available, using local search');
        }

        // Fallback to local search
        this.localSearch(query);
    }

    localSearch(query) {
        const queryLower = query.toLowerCase();
        const results = (window.DEMO_PRODUCTS || []).filter(product => {
            return product.title.toLowerCase().includes(queryLower) ||
                   product.category?.toLowerCase().includes(queryLower);
        });
        this.renderResults(results, query);
    }

    renderResults(results, query) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-no-results">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>No products found for "${query}"</p>
                    <p style="font-size: 0.75rem; color: #9CA3AF; margin-top: 0.5rem;">Try searching for something else</p>
                </div>
            `;
            return;
        }

        const resultsHtml = results.map(product => `
            <div class="search-result-item" onclick="searchEngine.selectProduct('${product.id}')">
                <div class="search-result-image">
                    <img src="${product.image || 'https://via.placeholder.com/56'}" alt="${product.title}">
                </div>
                <div class="search-result-info">
                    <div class="search-result-title">${product.title}</div>
                    <div class="search-result-category">${product.category || 'Electronics'}</div>
                </div>
                <div class="search-result-price">$${product.price?.toFixed(2) || '0.00'}</div>
            </div>
        `).join('');

        this.searchResults.innerHTML = resultsHtml;
    }

    selectProduct(productId) {
        this.close();
        // Navigate to product page or scroll to product
        window.location.href = `product.html?id=${productId}`;
    }
}


// =============================================================================
// AI CHATBOT
// =============================================================================

class AIChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
    }

    init() {
        this.createChatUI();
        this.bindEvents();
    }

    createChatUI() {
        const chatWidget = document.createElement('div');
        chatWidget.id = 'ai-chat-widget';
        chatWidget.innerHTML = `
            <!-- Chat Button -->
            <button id="chat-toggle" class="chat-toggle-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
            </button>

            <!-- Chat Window -->
            <div id="chat-window" class="chat-window">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-avatar">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <div>
                            <div class="chat-header-title">JT Assistant</div>
                            <div class="chat-header-status">Online</div>
                        </div>
                    </div>
                    <button id="chat-close" class="chat-close-btn">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div id="chat-messages" class="chat-messages">
                    <div class="chat-message bot">
                        <div class="chat-message-content">Hello! I'm your JT Mobamba assistant. How can I help you today?</div>
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" class="chat-input" placeholder="Type your message...">
                    <button id="chat-send" class="chat-send-btn">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(chatWidget);

        this.addChatStyles();
    }

    addChatStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #ai-chat-widget {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9998;
            }
            .chat-toggle-btn {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: #C4815D;
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(196, 129, 93, 0.4);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .chat-toggle-btn:hover {
                background: #A66B4A;
                transform: scale(1.05);
            }
            .chat-window {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 360px;
                height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            .chat-window.active {
                display: flex;
            }
            .chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                background: #C4815D;
                color: white;
            }
            .chat-header-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .chat-avatar {
                width: 36px;
                height: 36px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .chat-header-title {
                font-weight: 600;
                font-size: 0.875rem;
            }
            .chat-header-status {
                font-size: 0.75rem;
                opacity: 0.8;
            }
            .chat-close-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                transition: background 0.2s ease;
            }
            .chat-close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                background: #FFF8F0;
            }
            .chat-message {
                max-width: 80%;
                display: flex;
            }
            .chat-message.bot {
                align-self: flex-start;
            }
            .chat-message.user {
                align-self: flex-end;
            }
            .chat-message-content {
                padding: 0.75rem 1rem;
                border-radius: 12px;
                font-size: 0.875rem;
                line-height: 1.5;
            }
            .chat-message.bot .chat-message-content {
                background: white;
                color: #1A1A1A;
                border-bottom-left-radius: 4px;
            }
            .chat-message.user .chat-message-content {
                background: #C4815D;
                color: white;
                border-bottom-right-radius: 4px;
            }
            .chat-input-area {
                display: flex;
                gap: 0.5rem;
                padding: 1rem;
                border-top: 1px solid #E5E5E5;
                background: white;
            }
            .chat-input {
                flex: 1;
                padding: 0.75rem 1rem;
                border: 1px solid #E5E5E5;
                border-radius: 24px;
                font-size: 0.875rem;
                outline: none;
                transition: border-color 0.2s ease;
            }
            .chat-input:focus {
                border-color: #C4815D;
            }
            .chat-send-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #C4815D;
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }
            .chat-send-btn:hover {
                background: #A66B4A;
            }
            .chat-typing {
                display: flex;
                gap: 4px;
                padding: 0.75rem 1rem;
                background: white;
                border-radius: 12px;
                border-bottom-left-radius: 4px;
                width: fit-content;
            }
            .chat-typing-dot {
                width: 8px;
                height: 8px;
                background: #C4815D;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }
            .chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
            }
            @media (max-width: 480px) {
                .chat-window {
                    width: calc(100vw - 48px);
                    height: calc(100vh - 150px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        const toggleBtn = document.getElementById('chat-toggle');
        const closeBtn = document.getElementById('chat-close');
        const chatWindow = document.getElementById('chat-window');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');

        toggleBtn.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            chatWindow.classList.toggle('active', this.isOpen);
            if (this.isOpen) chatInput.focus();
        });

        closeBtn.addEventListener('click', () => {
            this.isOpen = false;
            chatWindow.classList.remove('active');
        });

        sendBtn.addEventListener('click', () => this.sendMessage());

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        // Get AI response
        const response = await this.getAIResponse(message);

        // Remove typing indicator and add response
        this.hideTyping();
        this.addMessage(response, 'bot');
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.innerHTML = `<div class="chat-message-content">${text}</div>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'chat-message bot';
        typingDiv.innerHTML = `
            <div class="chat-typing">
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    async getAIResponse(message) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                const data = await response.json();
                return data.response;
            }
        } catch (error) {
            console.log('API not available, using local responses');
        }

        // Fallback to local responses
        return this.getLocalResponse(message);
    }

    getLocalResponse(message) {
        const messageLower = message.toLowerCase();
        const responses = {
            greeting: [
                "Hello! How can I help you today?",
                "Hi there! What can I assist you with?",
                "Welcome! Feel free to ask me anything about our products."
            ],
            farewell: [
                "Thanks for chatting! Have a great day!",
                "Goodbye! Feel free to come back if you have more questions.",
                "Take care! Happy shopping!"
            ],
            shipping: [
                "We offer free shipping on orders over $50! Standard delivery takes 3-5 business days.",
                "Great news! Free shipping is available for orders above $50."
            ],
            returns: [
                "We have a 30-day return policy. If you're not satisfied, you can return the item for a full refund.",
                "Returns are easy! You have 30 days to return any product."
            ],
            warranty: [
                "All our products come with a 2-year warranty. We've got you covered!",
                "You get a full 2-year warranty with every purchase."
            ],
            default: [
                "I'd be happy to help with that! Could you provide more details?",
                "Interesting question! Let me see how I can assist you.",
                "I'm here to help. What specifically would you like to know?"
            ]
        };

        let category = 'default';
        if (['hello', 'hi', 'hey'].some(w => messageLower.includes(w))) category = 'greeting';
        else if (['bye', 'goodbye', 'thanks'].some(w => messageLower.includes(w))) category = 'farewell';
        else if (['shipping', 'delivery'].some(w => messageLower.includes(w))) category = 'shipping';
        else if (['return', 'refund'].some(w => messageLower.includes(w))) category = 'returns';
        else if (['warranty', 'guarantee'].some(w => messageLower.includes(w))) category = 'warranty';

        const options = responses[category];
        return options[Math.floor(Math.random() * options.length)];
    }
}


// =============================================================================
// INITIALIZE
// =============================================================================

const searchEngine = new SearchEngine();
const aiChatbot = new AIChatbot();

document.addEventListener('DOMContentLoaded', () => {
    searchEngine.init();
    aiChatbot.init();
});

// Export for global access
window.searchEngine = searchEngine;
window.aiChatbot = aiChatbot;
