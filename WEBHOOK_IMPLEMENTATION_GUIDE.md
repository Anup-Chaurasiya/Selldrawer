# Webhook Implementation Guide

This document explains all files created/modified for Shopify App Review compliance.

---

## 📁 File Structure

```
app/
├── utils/
│   └── verifyWebhook.server.ts          # HMAC signature verification
├── services/
│   └── compliance.server.ts             # Data deletion/retrieval helpers
└── routes/
    ├── webhooks.compliance.tsx          # Unified GDPR webhook handler
    ├── webhooks.app.uninstalled.tsx    # App uninstall handler
    ├── webhooks.app.scopes_update.tsx  # Scopes update handler
    ├── privacy-policy.tsx              # Privacy policy page
    └── terms-of-service.tsx            # Terms of service page

shopify.app.toml                        # Webhook configuration
```

---

## 1. 🔐 `app/utils/verifyWebhook.server.ts`

**Purpose**: Verifies HMAC-SHA256 signatures from Shopify webhooks

### How It Works:

```typescript
1. Receives raw request body (ArrayBuffer) and headers
2. Extracts X-Shopify-Hmac-Sha256 header
3. Calculates HMAC using SHOPIFY_API_SECRET
4. Compares with header using timing-safe comparison
5. Returns true/false
```

### Key Features:
- ✅ **Timing-Safe Comparison**: Uses `crypto.timingSafeEqual()` to prevent timing attacks
- ✅ **Raw Body**: Works with raw bytes (not parsed JSON) - critical for HMAC accuracy
- ✅ **Error Handling**: Returns `false` if header missing or invalid

### Security:
- Prevents unauthorized webhook requests
- Ensures payload hasn't been tampered with
- Required by Shopify for App Store approval

---

## 2. 🗄️ `app/services/compliance.server.ts`

**Purpose**: Helper functions for GDPR-compliant data operations

### Functions:

#### `deleteShopData(shop: string)`
- **What**: Deletes ALL data for a shop
- **When**: Called on `app/uninstalled` and `shop/redact`
- **How**: Uses Prisma transaction to delete from multiple tables:
  - Sessions
  - Cart configurations
  - Cart drawer settings
  - Analytics
  - Subscriptions
  - FBT rules
- **Why Transaction**: Ensures all-or-nothing deletion (prevents partial data leaks)

#### `getCustomerData(shop: string, customerId?: string)`
- **What**: Retrieves customer-specific data
- **When**: Called on `customers/data_request` (GDPR access request)
- **Returns**: Array of analytics records for that customer
- **Handles**: Missing customer ID gracefully (returns empty array)

#### `deleteCustomerData(shop: string, customerId?: string)`
- **What**: Deletes customer-specific data
- **When**: Called on `customers/redact` (GDPR deletion request)
- **Deletes**: Analytics records containing customer ID
- **Handles**: Missing customer ID gracefully (no-op)

---

## 3. 🔄 `app/routes/webhooks.compliance.tsx`

**Purpose**: Unified handler for all GDPR compliance webhooks

### How It Works:

```
1. Clone request to preserve raw body
2. Verify HMAC signature
3. If invalid → Return 401
4. Authenticate webhook (get shop, payload)
5. Get topic from X-Shopify-Topic header
6. Route to appropriate handler based on topic
```

### Routing Logic:

#### `customers/data_request`
- **Purpose**: GDPR data access request
- **Action**: Retrieves customer data
- **Response**: JSON with customer records
```json
{
  "status": "accepted",
  "customerId": "789",
  "customerEmail": "customer@example.com",
  "records": [...]
}
```

#### `customers/redact`
- **Purpose**: GDPR data deletion request
- **Action**: Deletes customer analytics data
- **Response**: JSON confirmation
```json
{
  "status": "completed",
  "customerId": "789",
  "shop": "test-shop.myshopify.com"
}
```

#### `shop/redact`
- **Purpose**: Shop data deletion (sent 48h after uninstall)
- **Action**: Deletes all shop data
- **Response**: Empty 200 OK

### Why Unified Handler?
- Shopify requires `compliance_topics` (not `topics`)
- All compliance webhooks must share one URI
- Single handler routes based on topic header

---

## 4. 🚪 `app/routes/webhooks.app.uninstalled.tsx`

**Purpose**: Handles app uninstall event

### Flow:
```
1. Verify HMAC signature
2. Authenticate webhook
3. Delete all shop data
4. Return 200 OK
```

### When Triggered:
- Merchant uninstalls app from Shopify admin
- Immediate deletion of all shop data

### Data Deleted:
- All tables related to the shop (via `deleteShopData()`)

---

## 5. 🔑 `app/routes/webhooks.app.scopes_update.tsx`

**Purpose**: Handles app permission changes

### Flow:
```
1. Verify HMAC signature
2. Authenticate webhook
3. Update session scopes in database
4. Return 200 OK
```

### When Triggered:
- Merchant changes app permissions in Shopify admin
- Updates stored session scopes to match new permissions

### Why Important:
- Keeps app permissions in sync
- Prevents permission mismatch errors

---

## 6. 📄 `app/routes/privacy-policy.tsx`

**Purpose**: Public privacy policy page (required for App Store)

### Features:
- Static React component
- GDPR-compliant content
- Explains data collection, usage, retention
- Contact information for privacy requests

### Access:
- URL: `/privacy-policy`
- Linked from landing page footer
- Required by Shopify App Store

### Content Sections:
1. Overview
2. Information We Collect
3. How We Use Information
4. Data Sharing
5. Data Retention & Deletion
6. Security
7. Your Rights
8. Contact

---

## 7. 📋 `app/routes/terms-of-service.tsx`

**Purpose**: Public terms of service page (required for App Store)

### Features:
- Static React component
- Legal terms for app usage
- Billing, cancellation, liability terms
- Contact information

### Access:
- URL: `/terms-of-service`
- Linked from landing page footer
- Required by Shopify App Store

### Content Sections:
1. Agreement
2. Access and License
3. Merchant Obligations
4. Billing & Cancellation
5. Data Handling
6. Availability & Support
7. Limitation of Liability
8. Termination
9. Changes to Terms
10. Contact

---

## 8. ⚙️ `shopify.app.toml`

**Purpose**: Webhook subscription configuration

### Configuration Structure:

```toml
[webhooks]
api_version = "2025-07"

# Regular webhooks (use "topics")
[[webhooks.subscriptions]]
topics = [ "app/uninstalled" ]
uri = "/webhooks/app/uninstalled"

# Compliance webhooks (MUST use "compliance_topics")
[[webhooks.subscriptions]]
compliance_topics = [ "customers/data_request", "customers/redact", "shop/redact" ]
uri = "/webhooks/compliance"
```

### Key Points:
- ✅ **Regular webhooks**: Use `topics = [...]`
- ✅ **Compliance webhooks**: Use `compliance_topics = [...]` (required by Shopify)
- ✅ **Single URI**: All compliance webhooks share one endpoint
- ✅ **API Version**: Must match your app's API version

### Why This Matters:
- Shopify CLI validates this configuration
- Incorrect syntax = App Review rejection
- `compliance_topics` is mandatory for GDPR webhooks

---

## 🔄 Complete Webhook Flow

### Example: `customers/data_request`

```
1. Shopify sends webhook
   POST /webhooks/compliance
   Headers:
     - X-Shopify-Hmac-Sha256: <signature>
     - X-Shopify-Topic: customers/data_request
   Body: { "shop_id": 123, "customer": {...} }

2. webhooks.compliance.tsx receives request
   - Clones request (preserves raw body)
   - Calls verifyWebhookSignature()
   
3. verifyWebhook.server.ts
   - Calculates HMAC from raw body + secret
   - Compares with header
   - Returns true/false

4. If valid:
   - authenticate.webhook() parses payload
   - Gets topic from header
   - Routes to customers/data_request case
   
5. compliance.server.ts
   - getCustomerData() queries database
   - Returns customer records
   
6. Response sent
   - 200 OK with JSON data
   - Shopify marks webhook as delivered
```

---

## 🛡️ Security Features

### 1. HMAC Verification
- Every webhook verified before processing
- Invalid signatures → 401 Unauthorized
- Prevents spoofed requests

### 2. Timing-Safe Comparison
- Uses `crypto.timingSafeEqual()`
- Prevents timing attacks
- Same execution time regardless of match

### 3. Raw Body Handling
- Uses raw bytes (not parsed JSON)
- Critical for HMAC accuracy
- Whitespace/formatting matters

### 4. Error Handling
- Graceful handling of missing data
- Proper HTTP status codes
- No sensitive data in error messages

---

## ✅ Shopify App Review Checklist

All requirements met:

- [x] **Mandatory webhooks implemented**
  - `app/uninstalled` ✅
  - `customers/data_request` ✅
  - `customers/redact` ✅
  - `shop/redact` ✅

- [x] **HMAC verification**
  - All webhooks verify signatures ✅
  - Returns 401 for invalid signatures ✅
  - Uses timing-safe comparison ✅

- [x] **Configuration**
  - Uses `compliance_topics` (not `topics`) ✅
  - All webhooks registered ✅
  - Correct API version ✅

- [x] **Privacy & Terms**
  - Privacy policy page ✅
  - Terms of service page ✅
  - Accessible URLs ✅

---

## 🚀 Deployment

1. **Deploy webhooks**:
   ```bash
   shopify app deploy
   ```

2. **Verify configuration**:
   ```bash
   shopify app info
   ```

3. **Test webhooks**:
   ```bash
   shopify app webhook trigger customers/data_request --api-version 2025-07
   ```

4. **Submit for review**:
   - Go to Shopify Partners Dashboard
   - Submit app for review
   - Automated checks should pass ✅

---

## 📝 Summary

All files work together to:
1. **Verify** webhook authenticity (HMAC)
2. **Handle** GDPR compliance requests
3. **Delete** data when required
4. **Provide** required legal pages
5. **Pass** Shopify App Review

The implementation is production-ready and compliant with Shopify's requirements! 🎉

