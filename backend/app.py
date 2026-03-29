"""
JT Mobamba AI Backend
Flask-based API with Machine Learning Recommendation System and AI Assistant
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import json
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)

# =============================================================================
# PRODUCT DATABASE
# =============================================================================

PRODUCTS = [
    {
        "id": "prod_001",
        "title": "Premium Wireless Earbuds",
        "price": 89.99,
        "category": "audio",
        "tags": ["wireless", "earbuds", "bluetooth", "music", "portable"],
        "rating": 4.5,
        "popularity": 128
    },
    {
        "id": "prod_002",
        "title": "Smart Watch Pro X",
        "price": 299.99,
        "category": "wearables",
        "tags": ["smartwatch", "fitness", "health", "wearable", "tracker"],
        "rating": 5.0,
        "popularity": 256
    },
    {
        "id": "prod_003",
        "title": "Portable Bluetooth Speaker",
        "price": 59.99,
        "category": "audio",
        "tags": ["speaker", "bluetooth", "portable", "music", "outdoor"],
        "rating": 4.2,
        "popularity": 89
    },
    {
        "id": "prod_004",
        "title": "MacBook Pro 16\"",
        "price": 2499.99,
        "category": "laptops",
        "tags": ["laptop", "macbook", "apple", "professional", "powerful"],
        "rating": 5.0,
        "popularity": 512
    },
    {
        "id": "prod_005",
        "title": "Ultra HD 4K Webcam",
        "price": 129.99,
        "category": "cameras",
        "tags": ["webcam", "4k", "streaming", "video", "conference"],
        "rating": 4.3,
        "popularity": 203
    },
    {
        "id": "prod_006",
        "title": "iPhone 15 Pro",
        "price": 999.99,
        "category": "smartphones",
        "tags": ["phone", "iphone", "apple", "smartphone", "mobile"],
        "rating": 4.9,
        "popularity": 445
    },
    {
        "id": "prod_007",
        "title": "Noise Cancelling Headphones",
        "price": 249.99,
        "category": "audio",
        "tags": ["headphones", "noise-cancelling", "wireless", "music", "premium"],
        "rating": 4.8,
        "popularity": 678
    },
    {
        "id": "prod_008",
        "title": "Smart Home Hub",
        "price": 149.99,
        "category": "smart-home",
        "tags": ["smart-home", "hub", "automation", "iot", "connected"],
        "rating": 4.1,
        "popularity": 156
    }
]

# =============================================================================
# AI CHATBOT RESPONSES
# =============================================================================

class AIAssistant:
    """AI Assistant with varied response patterns"""

    def __init__(self):
        self.greeting_patterns = [
            "Hello! How can I help you today?",
            "Hi there! What can I assist you with?",
            "Welcome to JT Mobamba! How may I help you?",
            "Hey! I'm here to help. What would you like to know?",
            "Greetings! Feel free to ask me anything about our products.",
        ]

        self.product_info_patterns = [
            "Great choice! The {product} is one of our most popular items. {details}",
            "The {product} is fantastic! {details}",
            "I'd recommend the {product}. {details}",
            "You're looking at the {product}? Excellent selection! {details}",
            "The {product} is a customer favorite. {details}",
        ]

        self.price_patterns = [
            "The {product} is priced at ${price}. It's a great value for what you get!",
            "You can get the {product} for just ${price}.",
            "The {product} costs ${price}. Would you like to know more about its features?",
            "At ${price}, the {product} offers excellent quality.",
            "The price for the {product} is ${price}. It's competitively priced!",
        ]

        self.recommendation_patterns = [
            "Based on your interests, I'd suggest checking out the {product}. {reason}",
            "You might love the {product}! {reason}",
            "I think the {product} would be perfect for you. {reason}",
            "Have you considered the {product}? {reason}",
            "Let me recommend the {product}. {reason}",
        ]

        self.shipping_patterns = [
            "We offer free shipping on orders over $50! Standard delivery takes 3-5 business days.",
            "Great news! Free shipping is available for orders above $50. Express shipping is also available.",
            "Shipping is free for orders over $50. You can expect delivery within 3-5 business days.",
            "We provide complimentary shipping on orders exceeding $50. Express options are available too!",
        ]

        self.return_patterns = [
            "We have a 30-day return policy. If you're not satisfied, you can return the item for a full refund.",
            "Returns are easy! You have 30 days to return any product for a complete refund.",
            "Our return policy gives you 30 days to return items. No questions asked!",
            "You can return any product within 30 days for a full refund. We want you to be happy!",
        ]

        self.warranty_patterns = [
            "All our products come with a 2-year warranty. We've got you covered!",
            "You get a full 2-year warranty with every purchase. Your satisfaction is guaranteed!",
            "We provide a comprehensive 2-year warranty on all products.",
            "Every item includes a 2-year warranty for your peace of mind.",
        ]

        self.fallback_patterns = [
            "I'm not quite sure about that. Could you rephrase your question?",
            "Interesting question! Let me think... Could you provide more details?",
            "I'd love to help with that! Can you tell me more about what you're looking for?",
            "That's a great question. Could you be more specific so I can assist better?",
            "I want to make sure I give you the right information. Can you elaborate?",
        ]

        self.farewell_patterns = [
            "Thanks for chatting! Have a great day!",
            "Goodbye! Feel free to come back if you have more questions.",
            "Take care! Happy shopping!",
            "Bye! Hope to see you again soon!",
            "Thanks for visiting JT Mobamba! Have an awesome day!",
        ]

    def detect_intent(self, message):
        """Detect the user's intent from their message"""
        message_lower = message.lower()

        # Greeting patterns
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'greetings', 'howdy']):
            return 'greeting'

        # Farewell patterns
        if any(word in message_lower for word in ['bye', 'goodbye', 'see you', 'thanks', 'thank you']):
            return 'farewell'

        # Price inquiry
        if any(word in message_lower for word in ['price', 'cost', 'how much', 'expensive', 'cheap', 'afford']):
            return 'price_inquiry'

        # Shipping inquiry
        if any(word in message_lower for word in ['shipping', 'delivery', 'ship', 'deliver', 'arrive']):
            return 'shipping'

        # Return policy
        if any(word in message_lower for word in ['return', 'refund', 'exchange', 'money back']):
            return 'returns'

        # Warranty
        if any(word in message_lower for word in ['warranty', 'guarantee', 'protection', 'covered']):
            return 'warranty'

        # Product recommendation
        if any(word in message_lower for word in ['recommend', 'suggest', 'best', 'popular', 'top', 'what should']):
            return 'recommendation'

        # Product info
        for product in PRODUCTS:
            if any(word in message_lower for word in product['title'].lower().split()):
                return 'product_info'

        # Category inquiry
        categories = ['audio', 'wearables', 'laptops', 'cameras', 'smartphones', 'smart-home']
        if any(cat in message_lower for cat in categories):
            return 'category'

        return 'unknown'

    def find_relevant_product(self, message):
        """Find a product mentioned in the message"""
        message_lower = message.lower()
        for product in PRODUCTS:
            title_words = product['title'].lower().split()
            if any(word in message_lower for word in title_words if len(word) > 3):
                return product
        return None

    def generate_response(self, message):
        """Generate an AI response based on user message"""
        intent = self.detect_intent(message)
        product = self.find_relevant_product(message)

        if intent == 'greeting':
            return random.choice(self.greeting_patterns)

        elif intent == 'farewell':
            return random.choice(self.farewell_patterns)

        elif intent == 'price_inquiry':
            if product:
                pattern = random.choice(self.price_patterns)
                return pattern.format(product=product['title'], price=product['price'])
            else:
                return "Which product would you like to know the price of? We have great options across all categories!"

        elif intent == 'shipping':
            return random.choice(self.shipping_patterns)

        elif intent == 'returns':
            return random.choice(self.return_patterns)

        elif intent == 'warranty':
            return random.choice(self.warranty_patterns)

        elif intent == 'recommendation':
            # Get top rated products
            top_products = sorted(PRODUCTS, key=lambda x: x['popularity'], reverse=True)[:3]
            product = random.choice(top_products)
            reasons = [
                "It's highly rated by our customers!",
                "It offers excellent value for money.",
                "It's one of our bestsellers.",
                "Customers love its quality and features.",
            ]
            pattern = random.choice(self.recommendation_patterns)
            return pattern.format(product=product['title'], reason=random.choice(reasons))

        elif intent == 'product_info':
            if product:
                details = [
                    f"It has a {product['rating']}-star rating and is loved by {product['popularity']} customers.",
                    f"Priced at ${product['price']}, it's excellent value.",
                    f"It's one of our top items in the {product['category']} category.",
                ]
                pattern = random.choice(self.product_info_patterns)
                return pattern.format(product=product['title'], details=random.choice(details))

        elif intent == 'category':
            message_lower = message.lower()
            for cat in ['audio', 'wearables', 'laptops', 'cameras', 'smartphones', 'smart-home']:
                if cat in message_lower:
                    cat_products = [p for p in PRODUCTS if p['category'] == cat]
                    if cat_products:
                        product_names = ', '.join([p['title'] for p in cat_products])
                        return f"In our {cat} category, we have: {product_names}. Would you like more details on any of these?"

        return random.choice(self.fallback_patterns)


# Initialize AI Assistant
ai_assistant = AIAssistant()


# =============================================================================
# RECOMMENDATION ENGINE
# =============================================================================

class RecommendationEngine:
    """Simple ML-based recommendation system"""

    def __init__(self, products):
        self.products = products
        self.user_interactions = {}

    def calculate_similarity(self, product1, product2):
        """Calculate similarity between two products based on tags and category"""
        score = 0

        # Category match
        if product1['category'] == product2['category']:
            score += 0.5

        # Tag overlap
        tags1 = set(product1['tags'])
        tags2 = set(product2['tags'])
        overlap = len(tags1.intersection(tags2))
        max_tags = max(len(tags1), len(tags2))
        if max_tags > 0:
            score += 0.3 * (overlap / max_tags)

        # Price range similarity
        price_diff = abs(product1['price'] - product2['price'])
        max_price = max(product1['price'], product2['price'])
        if max_price > 0:
            score += 0.2 * (1 - min(price_diff / max_price, 1))

        return score

    def get_similar_products(self, product_id, limit=4):
        """Get products similar to the given product"""
        target_product = next((p for p in self.products if p['id'] == product_id), None)
        if not target_product:
            return []

        similarities = []
        for product in self.products:
            if product['id'] != product_id:
                score = self.calculate_similarity(target_product, product)
                similarities.append((product, score))

        similarities.sort(key=lambda x: x[1], reverse=True)
        return [p[0] for p in similarities[:limit]]

    def get_popular_products(self, limit=4):
        """Get most popular products"""
        sorted_products = sorted(self.products, key=lambda x: x['popularity'], reverse=True)
        return sorted_products[:limit]

    def get_category_recommendations(self, category, limit=4):
        """Get top products in a category"""
        category_products = [p for p in self.products if p['category'] == category]
        sorted_products = sorted(category_products, key=lambda x: x['popularity'], reverse=True)
        return sorted_products[:limit]

    def get_personalized_recommendations(self, user_id, viewed_products=None, limit=4):
        """Get personalized recommendations based on user behavior"""
        if viewed_products is None:
            viewed_products = []

        if not viewed_products:
            return self.get_popular_products(limit)

        # Find similar products to what user has viewed
        recommendations = []
        for viewed_id in viewed_products:
            similar = self.get_similar_products(viewed_id, limit=2)
            recommendations.extend(similar)

        # Remove duplicates and viewed products
        seen_ids = set(viewed_products)
        unique_recommendations = []
        for product in recommendations:
            if product['id'] not in seen_ids:
                seen_ids.add(product['id'])
                unique_recommendations.append(product)

        # If not enough, add popular products
        if len(unique_recommendations) < limit:
            for product in self.get_popular_products(limit):
                if product['id'] not in seen_ids:
                    unique_recommendations.append(product)
                    seen_ids.add(product['id'])
                if len(unique_recommendations) >= limit:
                    break

        return unique_recommendations[:limit]


# Initialize Recommendation Engine
recommendation_engine = RecommendationEngine(PRODUCTS)


# =============================================================================
# API ROUTES
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })


@app.route('/api/chat', methods=['POST'])
def chat():
    """AI Chatbot endpoint"""
    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    response = ai_assistant.generate_response(message)

    return jsonify({
        'response': response,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/recommendations/similar/<product_id>', methods=['GET'])
def get_similar_products(product_id):
    """Get similar products"""
    limit = request.args.get('limit', 4, type=int)
    products = recommendation_engine.get_similar_products(product_id, limit)

    return jsonify({
        'recommendations': products,
        'count': len(products)
    })


@app.route('/api/recommendations/popular', methods=['GET'])
def get_popular_products():
    """Get popular products"""
    limit = request.args.get('limit', 4, type=int)
    products = recommendation_engine.get_popular_products(limit)

    return jsonify({
        'recommendations': products,
        'count': len(products)
    })


@app.route('/api/recommendations/category/<category>', methods=['GET'])
def get_category_recommendations(category):
    """Get category recommendations"""
    limit = request.args.get('limit', 4, type=int)
    products = recommendation_engine.get_category_recommendations(category, limit)

    return jsonify({
        'recommendations': products,
        'count': len(products)
    })


@app.route('/api/recommendations/personalized', methods=['POST'])
def get_personalized_recommendations():
    """Get personalized recommendations"""
    data = request.get_json()
    user_id = data.get('user_id', 'anonymous')
    viewed_products = data.get('viewed_products', [])
    limit = data.get('limit', 4)

    products = recommendation_engine.get_personalized_recommendations(
        user_id, viewed_products, limit
    )

    return jsonify({
        'recommendations': products,
        'count': len(products)
    })


@app.route('/api/search', methods=['GET'])
def search_products():
    """Search products"""
    query = request.args.get('q', '').lower()

    if not query:
        return jsonify({'results': [], 'count': 0})

    results = []
    for product in PRODUCTS:
        # Search in title
        if query in product['title'].lower():
            results.append(product)
            continue

        # Search in category
        if query in product['category'].lower():
            results.append(product)
            continue

        # Search in tags
        if any(query in tag for tag in product['tags']):
            results.append(product)

    return jsonify({
        'results': results,
        'count': len(results),
        'query': query
    })


@app.route('/api/products', methods=['GET'])
def get_all_products():
    """Get all products"""
    return jsonify({
        'products': PRODUCTS,
        'count': len(PRODUCTS)
    })


@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product"""
    product = next((p for p in PRODUCTS if p['id'] == product_id), None)

    if not product:
        return jsonify({'error': 'Product not found'}), 404

    return jsonify(product)


# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == '__main__':
    print("Starting JT Mobamba AI Backend...")
    print("Available endpoints:")
    print("  - GET  /api/health")
    print("  - POST /api/chat")
    print("  - GET  /api/search?q=<query>")
    print("  - GET  /api/products")
    print("  - GET  /api/products/<product_id>")
    print("  - GET  /api/recommendations/similar/<product_id>")
    print("  - GET  /api/recommendations/popular")
    print("  - GET  /api/recommendations/category/<category>")
    print("  - POST /api/recommendations/personalized")
    print("")
    app.run(debug=True, port=5000)
