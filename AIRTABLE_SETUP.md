# 🏨 Taj Hotel - Airtable Setup Guide

## Required Airtable Bases & Tables

Your system uses **2 separate Airtable bases** for better security and data isolation:

### 📋 BASE 1: Menu Management Base
**Purpose:** Store all dishes for the admin panel to manage.
**Tables:** 1 table (`Menu Items`)

### 📋 BASE 2: Orders Management Base
**Purpose:** Store orders, order items, and event bookings.
**Tables:** 3 tables (`Orders Details`, `Order Items`, `Event Bookings`)

> ⚠️ **Important:** `Orders Details` and `Order Items` MUST be in the same base because they use Airtable's "Link to Record" feature, which only works within a single base.

---

## 🔧 Environment Variables

Add these to your Vercel project settings:

### Base IDs
```
AIRTABLE_MENU_BASE_ID=appXXXXXXXXXXXXXX       # Base for Menu Items
AIRTABLE_ORDER_BASE_ID=appYYYYYYYYYYYYYY      # Base for Orders, Order Items, Events
```

> **Backward Compatibility:** If you only set `AIRTABLE_BASE_ID`, both menu and orders will use that single base.

### API Tokens (Separate for Security)
```
AIRTABLE_API_TOKEN_MENU=patXXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AIRTABLE_API_TOKEN_WRITE=patYYYYYYYYYYYYYYYY.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

> **Backward Compatibility:** If you only set `AIRTABLE_API_TOKEN`, all operations will use that single token.

### Table Names (Optional - defaults shown)
```
AIRTABLE_MENU_TABLE=Menu Items
AIRTABLE_ORDERS_TABLE=Orders Details
AIRTABLE_ORDER_ITEMS_TABLE=Order Items
AIRTABLE_EVENTS_TABLE=Event Bookings
```

---

## 🔑 How to Get These Values

### 1. Base IDs
- Open your Airtable base
- Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
- Copy the `appXXXXX...` part

**You need 2 bases:**
- **Menu Base:** Create a new Airtable base for menu items only
- **Order Base:** Use your existing base (or create new) for orders + order items + events

### 2. API Tokens
- Go to https://airtable.com/create/tokens
- Create separate tokens with appropriate access:

| Token Name | Access Needed | Purpose |
|------------|---------------|---------|
| `AIRTABLE_API_TOKEN_MENU` | Read + Write on Menu Base | Admin menu management |
| `AIRTABLE_API_TOKEN_WRITE` | Read + Write on Order Base | Orders + Kitchen operations |

> **Security Benefit:** If the menu token is compromised, orders remain safe. If the order token is compromised, menu remains safe.

---

## 📋 TABLE 1: `Menu Items` (Menu Base)

**Purpose:** Store all dishes for the admin panel to manage.

### Fields to Create:

| Field Name | Field Type | Description |
|-----------|-----------|-------------|
| `Name` | Single Line Text | Dish name (e.g., "Butter Chicken") |
| `Description` | Long Text | Dish description |
| `Full Price` | Currency (₹ INR) | Full portion price |
| `Half Price` | Currency (₹ INR) | Half portion price (leave empty if not applicable) |
| `Category` | Single Select | Options: `starters`, `main-veg`, `main-nonveg`, `breads`, `desserts`, `beverages` |
| `Is Veg` | Checkbox | Check if vegetarian |
| `Is Popular` | Checkbox | Check if popular dish |
| `Is Chef Special` | Checkbox | Check if chef's special |
| `In Stock` | Checkbox | **Toggle this for item availability** |

---

## 📋 TABLE 2: `Orders Details` (Order Base)

**Purpose:** Store order headers with customer info and overall status.

### Fields (ensure these exact names exist):

| Field Name | Field Type | Description |
|-----------|-----------|-------------|
| `Order Id` | Single Line Text | Custom order ID (e.g., "ORD-ABC123") |
| `Customer Name` | Single Line Text | Customer's name |
| `Table Number` | Single Line Text | e.g., "Table 12" |
| `Ordered Items` | Long Text | Text summary of all items |
| `Total Amount` | Currency (₹ INR) | Order total |
| `Order Status` | Single Select | **Critical:** Options: `Pending`, `Preparing`, `Ready`, `Completed` |
| `Notes Request` | Long Text | Customer notes/special requests |
| `Order Timestamp` | DateTime | When order was placed |

> ⚠️ **Important:** The status field MUST be named `Order Status` (with space) and be a Single Select type with these exact options.

---

## 📋 TABLE 3: `Order Items` (Order Base) ⭐

**Purpose:** Each row = one dish to prepare. This powers the Kitchen Dashboard.

### Fields to Create:

| Field Name | Field Type | Description |
|-----------|-----------|-------------|
| `Dish Name` | Single Line Text | Name of the dish |
| `Order` | Link to Record → Orders Details | Links to the parent order |
| `Variant` | Single Select | Options: `Full`, `Half` |
| `Quantity` | Number | How many to prepare |
| `Item Status` | Single Select | **Critical:** Options: `Pending`, `Preparing`, `Prepared`, `Served` |
| `Notes` | Single Line Text | Item-specific notes |
| `Created Time` | Created Time | Auto-tracked by Airtable |

### Setup Steps:
1. Create a new table named `Order Items` in your Order Base
2. Create a **Link to another record** field named `Order` that links to `Orders Details` table
3. Create all other fields listed above

> ⚠️ **Critical:** This table MUST be in the same base as `Orders Details` for the link field to work.

---

## 📋 TABLE 4: `Event Bookings` (Order Base)

**Purpose:** Store event booking requests. This can be in the Order Base.

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MENU BASE (appXXX...)                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Menu Items Table                                       │ │
│  │  - All dishes, prices, categories, stock status         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  Token: AIRTABLE_API_TOKEN_MENU                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ORDER BASE (appYYY...)                      │
│  ┌─────────────────────────┐  ┌───────────────────────────┐ │
│  │  Orders Details         │  │  Order Items              │ │
│  │  - Customer info        │←-│  - Dish name, qty         │ │
│  │  - Table number         │  │  - Item status            │ │
│  │  - Order status         │  │  - Linked to Order        │ │
│  │  - Total amount         │  │                           │ │
│  └─────────────────────────┘  └───────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Event Bookings Table                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│  Token: AIRTABLE_API_TOKEN_WRITE                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 How the System Works

### Order Flow:
```
Customer places order (index.html)
         ↓
/api/order creates (using ORDER BASE):
    1. Record in "Orders Details" (overall order)
    2. Individual records in "Order Items" (each dish)
         ↓
Kitchen Dashboard (kitchen.html) shows:
    - All pending orders
    - Each dish separately
    - Kitchen marks each dish as Preparing → Prepared
         ↓
Auto-updates order status:
    - When ALL items are "Prepared" → Order becomes "Ready"
         ↓
Admin Panel (admin.html) shows:
    - Revenue stats
    - All orders with status
    - Menu management (using MENU BASE)
```

### Kitchen Dashboard Features:
- **Real-time updates** - Polls every 5 seconds
- **Sound alerts** - Plays sound on new orders
- **Item grouping** - Groups identical items across orders
- **Status tracking** - Pending → Preparing → Prepared → Served
- **Auto-status** - Order becomes "Ready" when all items prepared

### Admin Panel Features:
- **Dashboard** - Today's revenue, order count, pending orders, avg order value
- **Menu Management** - Add/edit/delete dishes, toggle stock availability
- **All Orders** - View all orders, filter by status/date, change order status

---

## 🚀 Quick Setup Checklist

- [ ] Create Airtable base for Menu Items
- [ ] Create Airtable base for Orders (or use existing)
- [ ] Create `Menu Items` table in Menu Base
- [ ] Create `Orders Details` table in Order Base
- [ ] Create `Order Items` table in Order Base (with link to Orders Details)
- [ ] Create `Event Bookings` table in Order Base
- [ ] Create Airtable API tokens (separate for menu and orders)
- [ ] Add all environment variables to Vercel
- [ ] Deploy to Vercel
- [ ] Test order placement
- [ ] Test kitchen dashboard
- [ ] Test admin panel

---

## 📁 File Structure

```
taj-hotel/
├── index.html          # Customer menu & ordering
├── kitchen.html        # Kitchen dashboard (real-time)
├── admin.html          # Admin panel (management)
├── api/
│   ├── order.js        # Order submission API (ORDER BASE)
│   ├── order-status.js # Order status & fetching API (ORDER BASE)
│   └── menu.js         # Menu management API (MENU BASE)
└── AIRTABLE_SETUP.md   # This file
```

---

## 🔒 Security Notes

1. **Separate Tokens:** Each API endpoint uses its own token
   - `menu.js` → `AIRTABLE_API_TOKEN_MENU`
   - `order.js` → `AIRTABLE_API_TOKEN_WRITE`
   - `order-status.js` → `AIRTABLE_API_TOKEN_WRITE`

2. **Fallback:** If specific tokens aren't set, falls back to `AIRTABLE_API_TOKEN`

3. **Base Isolation:** Menu data is isolated in a separate base from orders

4. **Never expose tokens:** Tokens are stored server-side only via environment variables