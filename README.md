# 🏨 Taj Hotel - Digital Menu & Restaurant Management System

A professional, luxurious single-page digital menu card system with **Kitchen Dashboard**, **Admin Panel**, and **Airtable integration** for order management and event bookings.

---

## 📋 Airtable Setup (4 Tables Required)

Create these **4 tables** in your Airtable base:

### TABLE 1: `Menu Items`
| Field Name | Field Type |
|-----------|-----------|
| `Name` | Single Line Text |
| `Description` | Long Text |
| `Full Price` | Currency (₹ INR) |
| `Half Price` | Currency (₹ INR) |
| `Category` | Single Select: `starters`, `main-veg`, `main-nonveg`, `breads`, `desserts`, `beverages` |
| `Is Veg` | Checkbox |
| `Is Popular` | Checkbox |
| `Is Chef Special` | Checkbox |
| `In Stock` | Checkbox |
| `Image URL` | URL |

### TABLE 2: `Orders Details`
| Field Name | Field Type |
|-----------|-----------|
| `Order Id` | Single Line Text |
| `Customer Name` | Single Line Text |
| `Table Number` | Single Line Text |
| `Ordered Items` | Long Text |
| `Total Amount` | Currency (₹ INR) |
| `Order Status` | Single Select: `Pending`, `Preparing`, `Ready`, `Completed` |
| `Notes Request` | Long Text |
| `Order Timestamp` | DateTime |

### TABLE 3: `Order Items` ⭐ Critical for Kitchen
| Field Name | Field Type |
|-----------|-----------|
| `Order` | Link to Record → Orders Details |
| `Dish Name` | Single Line Text |
| `Variant` | Single Select: `Full`, `Half` |
| `Quantity` | Number |
| `Item Status` | Single Select: `Pending`, `Preparing`, `Prepared`, `Served` |
| `Notes` | Single Line Text |
| `Created Time` | Created Time |

### TABLE 4: `Event Bookings`
Already exists in your system. Used for event booking requests.

---

## 🔧 Environment Variables

Add these to Vercel (or your hosting platform):

```env
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_API_TOKEN=patXXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AIRTABLE_ORDERS_TABLE=Orders Details
AIRTABLE_ORDER_ITEMS_TABLE=Order Items
AIRTABLE_MENU_TABLE=Menu Items
AIRTABLE_EVENTS_TABLE=Event Bookings
```

### How to Get Values:
1. **Base ID**: From Airtable URL → `https://airtable.com/appXXXXXXX/...`
2. **API Token**: Create at https://airtable.com/create/tokens

---

## 🚀 Getting Started

### Local Development
```bash
npm install
npm run dev
```

### Deploy to Vercel
```bash
npm run deploy
```

Or connect your GitHub repo to Vercel for auto-deploy.

---

## 📁 Pages

| Page | Description |
|------|-------------|
| `index.html` | Customer-facing digital menu & ordering |
| `kitchen.html` | Kitchen dashboard (real-time order tracking) |
| `admin.html` | Admin panel (menu management, orders, revenue) |

---

## 🍽️ Kitchen Dashboard Features

- **Real-time updates** - Auto-refreshes every 5 seconds
- **Sound alerts** - Plays notification on new orders
- **Item-wise grouping** - See each dish separately for preparation
- **Group identical items** - Combine same dishes across orders
- **Status workflow** - Pending → Preparing → Prepared → Served
- **Auto-status** - Order becomes "Ready" when ALL items are prepared
- **Filter by status** - View Pending, Preparing, Ready, or Completed orders

---

## 👨‍💼 Admin Panel Features

### Dashboard Tab
- Today's revenue (calculated automatically)
- Total orders count
- Pending orders count
- Average order value

### Menu Management Tab
- Add new dishes with full details
- Edit existing dishes (name, price, category, etc.)
- Toggle stock availability (In Stock / Out of Stock)
- Filter by category
- Mark items as Popular or Chef's Special

### All Orders Tab
- View all orders with details
- Filter by status and date
- Change order status directly
- View order details popup

---

## 📊 Order Flow

```
Customer places order (index.html)
         ↓
/api/order creates:
    1. Record in "Orders Details" (overall order)
    2. Individual records in "Order Items" (each dish)
         ↓
Kitchen Dashboard (kitchen.html) shows:
    - Real-time order cards
    - Each dish listed separately
    - Kitchen marks: Start → Done for each item
         ↓
Auto-update: When ALL items = "Prepared" → Order = "Ready"
         ↓
Admin Panel (admin.html):
    - Revenue stats updated
    - Orders listed with status
    - Menu fully manageable
```

---

## 🎨 Design Features

- Luxury gold & dark theme
- Fully responsive (mobile, tablet, desktop)
- Smooth animations & transitions
- Receipt generation & download (PNG)
- Event booking system
- Veg/Non-veg indicators
- Half/Full portion pricing

---

## 📂 File Structure

```
taj-hotel/
├── index.html              # Customer menu & ordering
├── kitchen.html            # Kitchen dashboard
├── admin.html              # Admin panel
├── AIRTABLE_SETUP.md       # Detailed Airtable setup guide
├── README.md               # This file
├── package.json            # Dependencies
├── vercel.json             # Vercel config
└── api/
    ├── order.js            # Order submission (creates orders + items)
    ├── order-status.js     # Order fetching & status updates
    └── menu.js             # Menu CRUD operations
```

---

## 🔗 Quick Links

- **Menu**: `yoursite.com/` or `yoursite.com/index.html`
- **Kitchen**: `yoursite.com/kitchen.html`
- **Admin**: `yoursite.com/admin.html`

---

Built with ❤️ for Taj Hotel