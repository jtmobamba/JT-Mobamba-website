# Shopify Integration Setup Guide

This guide explains how to set up Shopify payments for the JT Mobamba Electronics store.

## Prerequisites

1. A Shopify store account (create one at [shopify.com](https://www.shopify.com))
2. Products added to your Shopify store
3. Storefront API access

## Step 1: Create a Shopify Store

1. Go to [shopify.com](https://www.shopify.com) and create an account
2. Choose a plan (you can start with a free trial)
3. Add your products to the store

## Step 2: Create a Storefront API Access Token

1. Log in to your Shopify Admin
2. Go to **Apps** > **Apps and sales channels**
3. Click **Develop apps** (you may need to enable development permissions first)
4. Click **Create an app**
5. Name your app (e.g., "JT Mobamba Web Store")
6. Click **Create app**

### Configure Storefront API Scopes

1. In your new app, go to **Configuration**
2. Under **Storefront API integration**, click **Configure**
3. Enable the following scopes:
   - `unauthenticated_read_checkouts`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_product_pickup_locations`
4. Click **Save**

### Get Your API Credentials

1. Go to **API credentials** tab
2. Under **Storefront API access token**, click **Install app**
3. Copy the **Storefront API access token**

## Step 3: Configure Your Website

Open `js/shop.js` and update the Shopify configuration:

```javascript
const SHOPIFY_CONFIG = {
    domain: 'your-store-name.myshopify.com', // Replace with your store domain
    storefrontAccessToken: 'your-token-here', // Replace with your token
    apiVersion: '2024-01'
};
```

## Step 4: Map Your Products

Each product needs a Shopify Product Variant ID. To get these:

1. In Shopify Admin, go to **Products**
2. Click on a product
3. The URL will show the product ID
4. Use the Shopify Admin API or GraphQL to get variant IDs

Then update the `DEMO_PRODUCTS` array in `js/shop.js`:

```javascript
const DEMO_PRODUCTS = [
    {
        id: 'prod_001',
        variantId: 'gid://shopify/ProductVariant/ACTUAL_VARIANT_ID', // Real Shopify variant ID
        title: 'Premium Wireless Earbuds',
        price: 89.99,
        image: 'your-product-image.jpg',
        // ... other properties
    },
    // ... more products
];
```

## Alternative: Using Shopify Buy Button

Instead of custom integration, you can use Shopify's Buy Button:

1. In Shopify Admin, go to **Sales channels**
2. Add the **Buy Button** channel
3. Create a Buy Button for each product
4. Embed the generated code on your website

## Testing

1. Enable test mode in Shopify Payments
2. Use Shopify's test credit card numbers:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVV: Any 3 digits

## Security Notes

- Never commit your Storefront API token to public repositories
- Use environment variables in production
- The Storefront API token is safe to use in client-side code (it only allows limited read/write access)

## Troubleshooting

### "Failed to create checkout"
- Verify your domain and access token are correct
- Check that the product variant IDs exist in your Shopify store
- Ensure products are available for sale (not draft or archived)

### CORS Errors
- The Shopify Storefront API allows cross-origin requests by default
- If you see CORS errors, check your Shopify app configuration

### Products Not Appearing
- Ensure products are published to the "Online Store" sales channel
- Check that products have available inventory

## Support

For Shopify-specific issues, visit:
- [Shopify Help Center](https://help.shopify.com)
- [Shopify Community Forums](https://community.shopify.com)
- [Storefront API Documentation](https://shopify.dev/docs/api/storefront)
