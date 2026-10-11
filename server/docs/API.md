# icagria API Documentation

This document describes all API endpoints implemented in the `icagria` backend service. It serves as the definitive API contract for frontend integration and client development.

---

## 1. Global Conventions

### Base URL
All API endpoints are mounted under `/api`.

### Response Format
All JSON responses follow a uniform structure:
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": {} // Object, array, or null
}
```

For list endpoints that support pagination or meta wrappers (e.g. listings), metadata may be nested under `data`:
```json
{
  "success": true,
  "data": {
    "listings": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Authentication & Authorization
Protected endpoints require an `Authorization` header containing a valid Bearer token:
```http
Authorization: Bearer <jwt_token>
```
Hardware sensor ingestion (`POST /api/readings`) uses device key authentication:
```http
x-device-key: <device_api_key_32_hex>
```

### Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Missing, expired, or invalid token / credentials.
- `403 Forbidden`: Authenticated user lacks permission for the action or resource.
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Business logic conflict (e.g., duplicate unique record, state machine transition violation, insufficient stock, deletion blocked by foreign references).
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
- **Access**: Public
- **Body**:
  ```json
  {
    "name": "Jane Farmer",
    "email": "jane@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "role": "farmer" // "farmer" | "buyer" ("admin" registration is forbidden)
  }
  ```
- **Response `data` (201)**:
  ```json
  {
    "token": "jwt_token_string",
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "name": "Jane Farmer",
      "email": "jane@example.com",
      "role": "farmer",
      "createdAt": "2026-10-11T10:00:00.000Z",
      "updatedAt": "2026-10-11T10:00:00.000Z"
    }
  }
  ```

### `POST /api/auth/login`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response `data` (200)**:
  ```json
  {
    "token": "jwt_token_string",
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "name": "Jane Farmer",
      "email": "jane@example.com",
      "role": "farmer"
    }
  }
  ```

### `GET /api/auth/me`
- **Access**: Protected (Any authenticated user)
- **Response `data` (200)**:
  ```json
  {
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Jane Farmer",
    "email": "jane@example.com",
    "role": "farmer",
    "phone": "+6281234567890",
    "address": "Bogor, Indonesia"
  }
  ```

### `PUT /api/auth/me`
- **Access**: Protected (Any authenticated user)
- **Body**:
  ```json
  {
    "name": "Jane Doe Farmer",
    "phone": "+6281234567890",
    "address": "Bogor, Indonesia"
  }
  ```
- **Response `data` (200)**:
  Updated user object without password hash.

---

## 3. Users (`/api/users`)

### `GET /api/users`
- **Access**: Protected (Admin only)
- **Query Parameters**:
  - `role` (optional): Filter by role (`farmer`, `buyer`, `admin`).
- **Response `data` (200)**: Array of user objects (excluding password hashes), sorted newest first.

---

## 4. Admin Management (`/api/admin`)

### `GET /api/admin/stats`
- **Access**: Protected (Admin only)
- **Response `data` (200)**:
  ```json
  {
    "counts": {
      "users": { "total": 10, "farmer": 6, "buyer": 3, "admin": 1 },
      "farms": 5,
      "plantings": 8,
      "devices": 5,
      "readings": 240,
      "listings": { "total": 12, "available": 8, "reserved": 2, "sold": 2 },
      "inquiries": { "total": 6, "pending": 3, "accepted": 2, "rejected": 1 },
      "products": 9,
      "bookings": { "total": 4, "pending": 1, "confirmed": 1, "delivered": 1, "cancelled": 1 }
    },
    "overview": [
      { "name": "Users", "value": 10 },
      { "name": "Farms", "value": 5 },
      { "name": "Products", "value": 9 },
      { "name": "Listings", "value": 12 },
      { "name": "Bookings", "value": 4 }
    ],
    "recentUsers": [ ... ],
    "recentListings": [ ... ],
    "recentProducts": [ ... ]
  }
  ```

### `GET /api/admin/users/:id`
- **Access**: Protected (Admin only)
- **Response `data` (200)**:
  ```json
  {
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "name": "Demo Farmer",
      "email": "farmer@icagria.test",
      "role": "farmer"
    },
    "counts": {
      "farms": 2,
      "listings": 2,
      "bookings": 0
    }
  }
  ```

### `PUT /api/admin/users/:id`
- **Access**: Protected (Admin only)
- **Rules**: Admin cannot change their own role (409); last remaining admin cannot be demoted (409).
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "phone": "+628111222333",
    "address": "Updated Address",
    "role": "farmer" // "farmer" | "buyer" | "admin"
  }
  ```
- **Response `data` (200)**: Updated user object.

### `DELETE /api/admin/users/:id`
- **Access**: Protected (Admin only)
- **Rules**: Admin cannot delete themselves (409) or another admin (409). Cascades deletion across the user's farms, plantings, devices, readings, alerts, listings, inquiries, and restores stock for pending product bookings.
- **Response `data` (200)**:
  ```json
  {
    "success": true,
    "message": "User and all associated data deleted successfully"
  }
  ```

---

## 5. Crops (`/api/crops`)

### `GET /api/crops`
- **Access**: Public
- **Query Parameters**:
  - `type` (optional): Filter by `tuber` or `legume`.
  - `search` (optional): Search by crop name (case-insensitive regex).
- **Response `data` (200)**: Array of crop objects, sorted by name ascending.

### `GET /api/crops/:id`
- **Access**: Public
- **Response `data` (200)**: Crop object.

### `POST /api/crops`
- **Access**: Protected (Admin only)
- **Body**:
  ```json
  {
    "name": "Cassava",
    "type": "tuber",
    "scientificName": "Manihot esculenta",
    "phMin": 5.5,
    "phMax": 6.5,
    "growthDays": 270,
    "growthPeriod": "8-12 months",
    "season": "Varies",
    "sowingTime": "Rainy season",
    "harvestTime": "Dry season",
    "climate": "Tropical",
    "soilType": "Well-drained sandy loam",
    "pests": ["Cassava mealybug"],
    "fertilizers": ["Nitrogen", "Potassium"],
    "pesticides": [],
    "imageUrl": ""
  }
  ```
- **Response `data` (201)**: Created crop object.

### `PUT /api/crops/:id`
- **Access**: Protected (Admin only)
- **Body**: Partial crop fields. Validates `phMin <= phMax`.
- **Response `data` (200)**: Updated crop object.

### `DELETE /api/crops/:id`
- **Access**: Protected (Admin only)
- **Rules**: Returns 409 if referenced by any existing plantings.
- **Response (200)**: `{ "success": true, "message": "Crop deleted successfully" }`

---

## 6. Farms (`/api/farms`)

### `POST /api/farms`
- **Access**: Protected (Farmer only)
- **Body**:
  ```json
  {
    "name": "Plot 1",
    "location": {
      "text": "Bogor, West Java",
      "lat": -6.595,
      "lng": 106.817
    },
    "areaSize": 2.5,
    "mainCrop": "60d0fe4f5311236168a109aa",
    "establishedDate": "2024-01-01"
  }
  ```
- **Response `data` (201)**: Created farm object with `mainCrop` populated.

### `GET /api/farms`
- **Access**: Protected (Farmer sees own; Admin sees all with `owner` populated)
- **Response `data` (200)**: Array of farm objects.

### `GET /api/farms/:id`
- **Access**: Protected (Owner or Admin)
- **Response `data` (200)**: Farm object with populated `mainCrop` (and `owner` if Admin).

### `PUT /api/farms/:id`
- **Access**: Protected (Owner only)
- **Body**: Partial farm fields (`name`, `location`, `areaSize`, `mainCrop`, `establishedDate`).
- **Response `data` (200)**: Updated farm object.

### `DELETE /api/farms/:id`
- **Access**: Protected (Owner only)
- **Rules**: Cascades deletion of all associated plantings, devices, readings, and alerts.
- **Response (200)**: `{ "success": true, "message": "Farm and associated data deleted successfully" }`

---

## 7. Plantings (`/api/plantings`)

### `POST /api/plantings`
- **Access**: Protected (Farmer on own farm)
- **Body**:
  ```json
  {
    "farm": "60d0fe4f5311236168a109bb",
    "crop": "60d0fe4f5311236168a109aa",
    "variety": "Local White",
    "quantity": 100,
    "plantedDate": "2026-09-01",
    "expectedHarvestDate": "2026-12-30" // Optional; computed automatically from crop.growthDays if omitted
  }
  ```
- **Response `data` (201)**: Created planting object.

### `GET /api/plantings`
- **Access**: Protected (Farmer sees own farms'; Admin sees all)
- **Query Parameters**:
  - `farmId` (optional): Filter plantings by specific farm.
- **Response `data` (200)**: Array of planting objects with populated `crop` and `farm`.

### `GET /api/plantings/:id`
- **Access**: Protected (Owner or Admin)
- **Response `data` (200)**: Planting object.

### `PUT /api/plantings/:id`
- **Access**: Protected (Owner only)
- **Body**: Partial planting fields (`variety`, `quantity`, `plantedDate`, `expectedHarvestDate`, `status` ["growing" | "harvested"]).
- **Response `data` (200)**: Updated planting object.

### `DELETE /api/plantings/:id`
- **Access**: Protected (Owner only)
- **Response (200)**: `{ "success": true, "message": "Planting deleted successfully" }`

---

## 8. Devices (`/api/devices`)

### `POST /api/devices`
- **Access**: Protected (Farmer on own farm)
- **Body**:
  ```json
  {
    "farm": "60d0fe4f5311236168a109bb",
    "name": "Soil pH Sensor 1",
    "type": "soil-ph",
    "source": "simulated" // "simulated" | "hardware"
  }
  ```
- **Response `data` (201)**: Created device object. If `source === 'hardware'`, returns `apiKey`.

### `GET /api/devices`
- **Access**: Protected (Farmer sees own; Admin sees all)
- **Query Parameters**:
  - `farmId` (optional): Filter devices by farm.
- **Response `data` (200)**: Array of device objects (apiKey is hidden).

### `PUT /api/devices/:id`
- **Access**: Protected (Owner only)
- **Body**: Partial device fields (`name`, `status` ["active" | "inactive"]).
- **Response `data` (200)**: Updated device object.

### `POST /api/devices/:id/regenerate-key`
- **Access**: Protected (Owner only)
- **Response `data` (200)**: Device object containing newly generated `apiKey`.

### `DELETE /api/devices/:id`
- **Access**: Protected (Owner only)
- **Rules**: Cascades deletion of all historical readings associated with the device.
- **Response (200)**: `{ "success": true, "message": "Device deleted successfully" }`

---

## 9. Soil pH Readings (`/api/readings`)

### `POST /api/readings`
- **Access**: Hardware Sensor Ingestion (via `x-device-key` header)
- **Headers**:
  - `x-device-key: <device_api_key>`
- **Body**:
  ```json
  {
    "value": 6.4,
    "recordedAt": "2026-10-11T12:00:00.000Z" // Optional, defaults to now
  }
  ```
- **Response `data` (201)**: Created reading object. Triggers automated out-of-range alert evaluation.

### `POST /api/readings/simulate`
- **Access**: Protected (Farmer on own farm)
- **Body**:
  ```json
  {
    "farmId": "60d0fe4f5311236168a109bb",
    "mode": "auto" // "auto" | "low" | "high" | "normal"
  }
  ```
- **Response `data` (201)**:
  ```json
  {
    "reading": { ... },
    "evaluation": {
      "status": "suitable",
      "label": "Suitable",
      "message": "Soil pH is within suitable range..."
    },
    "alert": null // Alert object if out of range, otherwise null
  }
  ```

### `GET /api/readings`
- **Access**: Protected (Owner or Admin)
- **Query Parameters**:
  - `farmId` (required)
  - `days` (optional, default 7)
  - `limit` (optional, default 100)
- **Response `data` (200)**: Array of readings in chronological order with evaluated `status`.

### `GET /api/readings/latest`
- **Access**: Protected (Owner or Admin)
- **Query Parameters**:
  - `farmId` (required)
- **Response `data` (200)**: Latest reading and its evaluation against the farm's main crop.

### `GET /api/readings/summary`
- **Access**: Protected (Owner or Admin)
- **Query Parameters**:
  - `farmId` (required)
  - `days` (optional, default 30)
- **Response `data` (200)**: Aggregated min, max, avg, count, and daily time-bucketed averages.

### `DELETE /api/readings/:id`
- **Access**: Protected (Owner only)
- **Response (200)**: `{ "success": true, "message": "Reading deleted successfully" }`

---

## 10. Alerts (`/api/alerts`)

### `GET /api/alerts`
- **Access**: Protected (Authenticated user)
- **Query Parameters**:
  - `farmId` (optional)
  - `unread` (optional, boolean)
  - `limit` (optional, default 50)
- **Response `data` (200)**: Array of alert objects for the user.

### `GET /api/alerts/unread-count`
- **Access**: Protected (Authenticated user)
- **Response `data` (200)**: `{ "unreadCount": 3 }`

### `PUT /api/alerts/read-all`
- **Access**: Protected (Authenticated user)
- **Response `data` (200)**: `{ "success": true, "message": "All alerts marked as read" }`

### `PUT /api/alerts/:id/read`
- **Access**: Protected (Owner only)
- **Response `data` (200)**: Updated alert object with `isRead: true`.

### `DELETE /api/alerts/:id`
- **Access**: Protected (Owner only)
- **Response (200)**: `{ "success": true, "message": "Alert deleted successfully" }`

### `POST /api/alerts/scan`
- **Access**: Protected (Farmer on own farm)
- **Body**: `{ "farmId": "60d0fe4f5311236168a109bb" }`
- **Response `data` (200)**: `{ "created": 1, "scanned": 12 }`

---

## 11. Weather (`/api/weather`)

### `GET /api/weather`
- **Access**: Protected (Any authenticated user)
- **Query Parameters**:
  - Provide either `farmId` OR (`lat` AND `lon`).
- **Response `data` (200)**: Current weather, temperature, humidity, rainfall, 5-day forecast array, and general farming agricultural weather tips. Never leaks third-party API keys.

---

## 12. Marketplace Listings (`/api/listings`)

### `POST /api/listings`
- **Access**: Protected (Farmer only)
- **Body**:
  ```json
  {
    "cropName": "Sweet Potato",
    "crop": "60d0fe4f5311236168a109aa", // optional crop ID
    "quantity": 500,
    "unit": "kg", // "kg" | "ton"
    "pricePerUnit": 8000,
    "location": "Bogor, West Java",
    "description": "Fresh harvest grade A"
  }
  ```
- **Response `data` (201)**: Created listing object with seller name (phone and email omitted).

### `GET /api/listings`
- **Access**: Protected (Any authenticated user)
- **Query Parameters**:
  - `crop` (optional)
  - `search` (optional)
  - `status` (optional, default `available`)
  - `sort` (optional: `price_asc`, `price_desc`, `date_desc`, default `date_desc`)
  - `page` (optional, default 1)
  - `limit` (optional, default 20)
- **Response `data` (200)**:
  `{ "listings": [...], "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 } }`. Never exposes seller phone or email.

### `GET /api/listings/:id`
- **Access**: Protected
- **Response `data` (200)**: Listing object. Contact phone/email are redacted.

### `PUT /api/listings/:id`
- **Access**: Protected (Seller owner only)
- **Rules**: Sold listings cannot be modified (returns 409). Setting status to `sold` automatically rejects all associated pending inquiries.
- **Body**: Partial listing fields.
- **Response `data` (200)**: Updated listing object.

### `DELETE /api/listings/:id`
- **Access**: Protected (Seller owner only)
- **Rules**: Sold listings cannot be deleted (returns 409). Deletes listing and cascades deletion of its inquiries.
- **Response (200)**: `{ "success": true, "message": "Listing deleted successfully" }`

---

## 13. Marketplace Inquiries (`/api/inquiries`)

### `POST /api/inquiries`
- **Access**: Protected (Buyer only)
- **Body**:
  ```json
  {
    "listing": "60d0fe4f5311236168a109cc",
    "quantity": 100, // optional, <= listing quantity
    "message": "Interested in purchasing this batch"
  }
  ```
- **Rules**: Listing must be `available`. Duplicate pending inquiries for same buyer return 409.
- **Response `data` (201)**: Created inquiry object. Seller contact phone is redacted while pending.

### `GET /api/inquiries`
- **Access**: Protected (Buyer sees own; Farmer sees inquiries on their listings; Admin sees all)
- **Query Parameters**:
  - `status` (optional: `pending`, `accepted`, `rejected`)
  - `listingId` (optional)
- **Response `data` (200)**: Array of inquiries. Seller phone is only visible to buyer after inquiry status is `accepted`.

### `PUT /api/inquiries/:id/status`
- **Access**: Protected (Listing seller owner only)
- **Body**:
  ```json
  {
    "status": "accepted" // "accepted" | "rejected"
  }
  ```
- **Rules**: Only `pending` inquiries can be accepted/rejected. Accepting marks listing status `reserved`.
- **Response `data` (200)**: Updated inquiry object.

### `DELETE /api/inquiries/:id`
- **Access**: Protected (Buyer owner only)
- **Rules**: Only `pending` inquiries may be deleted (403 if already accepted/rejected).
- **Response (200)**: `{ "success": true, "message": "Inquiry deleted successfully" }`

---

## 14. Products (`/api/products`)

### `GET /api/products`
- **Access**: Protected (Any authenticated user)
- **Query Parameters**:
  - `category` (optional: `seeds`, `fertilizer`, `pesticide`, `equipment`, `other`)
  - `search` (optional, case-insensitive on product name)
- **Response `data` (200)**: Array of product objects sorted by name ascending.

### `GET /api/products/:id`
- **Access**: Protected
- **Response `data` (200)**: Product object.

### `POST /api/products`
- **Access**: Protected (Admin only)
- **Body**:
  ```json
  {
    "name": "NPK Fertilizer (5 kg)",
    "category": "fertilizer",
    "price": 85000,
    "stock": 30,
    "description": "Balanced compound fertilizer",
    "imageUrl": ""
  }
  ```
- **Response `data` (201)**: Created product object.

### `PUT /api/products/:id`
- **Access**: Protected (Admin only)
- **Body**: Partial product fields (`name`, `category`, `price`, `description`, `imageUrl`, `stock`).
- **Response `data` (200)**: Updated product object.

### `DELETE /api/products/:id`
- **Access**: Protected (Admin only)
- **Response (200)**: `{ "success": true, "message": "Product deleted successfully" }`

---

## 15. Bookings (`/api/bookings`)

### `POST /api/bookings`
- **Access**: Protected (Farmer only)
- **Product Booking**:
  ```json
  {
    "type": "product",
    "product": "60d0fe4f5311236168a109dd",
    "quantity": 2,
    "notes": "Deliver to farm gate"
  }
  ```
  - *Rules*: Decreases product stock atomically. If stock is insufficient, returns 409 "Not enough stock". Ignores any client-supplied `totalAmount` and computes `totalAmount = price * quantity`. Stores snapshots `productName` and `unitPrice`.
- **Consultation Booking**:
  ```json
  {
    "type": "consultation",
    "scheduledAt": "2026-11-01T09:00:00.000Z",
    "notes": "Soil conditioning advice"
  }
  ```
  - *Rules*: `scheduledAt` must be in the future (otherwise 400). `totalAmount` is 0.
- **Response `data` (201)**: Created booking object.

### `GET /api/bookings`
- **Access**: Protected (Farmer sees own; Admin sees all with user `name` and `email` populated)
- **Query Parameters**:
  - `type` (optional: `product`, `consultation`)
  - `status` (optional: `pending`, `confirmed`, `delivered`, `cancelled`)
- **Response `data` (200)**: Array of booking objects sorted newest first.

### `PUT /api/bookings/:id/cancel`
- **Access**: Protected (Owner only)
- **Rules**: Only allowed while booking status is `pending`. Automatically restores product stock for product bookings.
- **Response `data` (200)**: Cancelled booking object.

### `PUT /api/bookings/:id/status`
- **Access**: Protected (Admin only)
- **Body**:
  ```json
  {
    "status": "confirmed" // "confirmed" | "delivered" | "cancelled"
  }
  ```
- **Rules**: Allowed status transitions:
  - `pending` -> `confirmed`
  - `confirmed` -> `delivered`
  - `pending` or `confirmed` -> `cancelled` (restores product stock)
  - Any other transition returns 409 Conflict.
- **Response `data` (200)**: Updated booking object.

---

## 16. Pest Tips (`/api/pest-tips`)

### `GET /api/pest-tips`
- **Access**: Protected (Farmer on own farm)
- **Query Parameters**:
  - `farmId` (required)
- **Response `data` (200)**:
  ```json
  {
    "success": true,
    "disclaimer": "General guidance only. Confirm with a local agricultural extension officer.",
    "data": [
      {
        "cropName": "Sweet potato",
        "pests": [
          {
            "name": "Sweet potato weevil",
            "tips": [
              "Inspect plants regularly",
              "Use clean planting material and healthy vine cuttings",
              "Hill up soil around tuber roots to prevent cracking and exposure",
              "Remove infected plant debris and crop residue promptly",
              "Rotate crops with non-host crops",
              "Ask the local agricultural extension officer about treatment"
            ]
          }
        ]
      }
    ]
  }
  ```

---

## 17. Reports (`/api/reports`)

### `GET /api/reports/farm-summary`
- **Access**: Protected (Farmer on own farm)
- **Query Parameters**:
  - `farmId` (required)
  - `days` (optional, default 30)
- **Response `data` (200)**:
  ```json
  {
    "farm": { ... },
    "plantings": [
      {
        "_id": "...",
        "cropName": "Sweet potato",
        "variety": "Local",
        "plantedDate": "2026-08-01T00:00:00.000Z",
        "expectedHarvestDate": "2026-11-29T00:00:00.000Z",
        "daysToHarvest": 49,
        "status": "growing"
      }
    ],
    "ph": {
      "min": 5.8,
      "max": 6.8,
      "avg": 6.25,
      "outOfRangeCount": 2,
      "inRangePercent": 96.7,
      "count": 60
    },
    "alertsCount": 4,
    "unreadAlerts": 1,
    "bookingsTotalSpent": 150000
  }
  ```

### `GET /api/reports/sales`
- **Access**: Protected (Farmer only)
- **Response `data` (200)**:
  ```json
  {
    "byStatus": {
      "available": { "count": 2, "totalQuantityKg": 250, "estimatedValue": 0 },
      "reserved": { "count": 1, "totalQuantityKg": 50, "estimatedValue": 0 },
      "sold": { "count": 3, "totalQuantityKg": 600, "estimatedValue": 4800000 }
    },
    "totalListings": 6,
    "totalQuantityKg": 900,
    "estimatedValue": 4800000
  }
  ```
