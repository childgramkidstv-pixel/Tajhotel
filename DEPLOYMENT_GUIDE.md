# 🏨 TAJ HOTEL - COMPLETE DEPLOYMENT GUIDE

## 📁 FILES TO UPLOAD TO GITHUB

Upload **ALL** these files from your project folder:

### ✅ Required Files (Upload Everything):
```
index.html          → Customer menu page (main page)
admin.html          → Admin dashboard (staff only)
kitchen.html        → Kitchen display (staff only)
package.json        → Project configuration
vercel.json         → Vercel server configuration
.gitignore          → Files to ignore

api/                → Server-side API folder (IMPORTANT!)
  ├── order.js      → Handles orders & event bookings
  ├── menu.js       → Handles menu items (admin)
  └── order-status.js → Handles order status updates

.env.local          → DO NOT UPLOAD! (Contains secret keys)
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### STEP 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `taj-hotel` (or any name you want)
3. Select **Public** or **Private**
4. Click **Create repository**

### STEP 2: Upload Files to GitHub

**Option A: Using Git (Recommended)**

Open Command Prompt/Terminal in your project folder:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add index.html admin.html kitchen.html package.json vercel.json .gitignore api/

# Create .gitignore to exclude secrets
echo ".env.local" >> .gitignore
echo "node_modules/" >> .gitignore

# Commit
git commit -m "Taj Hotel - Initial deployment"

# Connect to GitHub (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/taj-hotel.git
git branch -M main
git push -u origin main
```

**Option B: Using GitHub Website (Easier)**

1. On your new GitHub repository page, click **uploading an existing file**
2. Drag and drop these files:
   - `index.html`
   - `admin.html`
   - `kitchen.html`
   - `package.json`
   - `vercel.json`
   - `.gitignore`
3. Create a folder named `api` on GitHub
4. Inside `api` folder, upload:
   - `order.js`
   - `menu.js`
   - `order-status.js`
5. Click **Commit changes**

### STEP 3: Deploy on Vercel

1. Go to https://vercel.com
2. Sign up/Login (use GitHub account)
3. Click **Add New...** → **Project**
4. Find your `taj-hotel` repository → Click **Import**
5. Framework Preset: Select **Other**
6. Click **Deploy**

### STEP 4: Add Environment Variables (CRITICAL!)

After importing, BEFORE deploying:

1. On Vercel project page, go to **Settings** → **Environment Variables**
2. Add these variables (copy values from your `.env.local` file):

| Variable Name | Where to Find It |
|--------------|------------------|
| `AIRTABLE_BASE_ID` | Your Airtable base ID |
| `AIRTABLE_API_TOKEN` | Your Airtable API token |
| `AIRTABLE_API_TOKEN_WRITE` | Your Airtable write token |
| `AIRTABLE_API_TOKEN_MENU` | Your Airtable menu token |
| `AIRTABLE_MENU_BASE_ID` | Your Menu Base ID |
| `AIRTABLE_ORDER_BASE_ID` | Your Order Base ID |
| `AIRTABLE_MENU_TABLE` | `Menu Items` |
| `AIRTABLE_ORDER_TABLE` | `Orders Details` |
| `AIRTABLE_EVENT_TABLE` | `Event Bookings` |
| `AIRTABLE_ORDER_ITEMS_TABLE` | `Order Items` |

3. Click **Save** after adding each variable

### STEP 5: Redeploy

1. Go to **Deployments** tab
2. Click the 3 dots (⋮) next to your deployment
3. Click **Redeploy**

---

## 📋 YOUR .ENV.LOCAL VALUES

Open your `.env.local` file and copy these values to Vercel:

```
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_API_TOKEN=patXXXXXXXXXXXXX
AIRTABLE_API_TOKEN_WRITE=patXXXXXXXXXXXXX
AIRTABLE_API_TOKEN_MENU=patXXXXXXXXXXXXX
AIRTABLE_MENU_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_ORDER_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_MENU_TABLE=Menu Items
AIRTABLE_ORDER_TABLE=Orders Details
AIRTABLE_EVENT_TABLE=Event Bookings
AIRTABLE_ORDER_ITEMS_TABLE=Order Items
```

⚠️ **NEVER upload `.env.local` to GitHub!** It contains secret keys.

---

## ✅ AFTER DEPLOYMENT

1. Vercel will give you a URL like: `https://taj-hotel.vercel.app`
2. **Customer URL**: Share `https://taj-hotel.vercel.app` with customers
3. **Admin URL**: `https://taj-hotel.vercel.app/admin.html` (for staff)
4. **Kitchen URL**: `https://taj-hotel.vercel.app/kitchen.html` (for kitchen staff)

---

## 🧪 TESTING AFTER DEPLOYMENT

1. Open `https://your-domain.vercel.app` → Should see menu
2. Add items to cart → Place order → Should succeed
3. Open `https://your-domain.vercel.app/kitchen.html` → Should see the order
4. Open `https://your-domain.vercel.app/admin.html` → Should see stats

---

## 📁 COMPLETE FILE STRUCTURE

```
taj-hotel/
├── index.html              ✅ Customer menu
├── admin.html              ✅ Admin dashboard
├── kitchen.html            ✅ Kitchen display
├── package.json            ✅ Dependencies
├── vercel.json             ✅ Vercel config
├── .gitignore              ✅ Ignore secrets
├── .env.local              ❌ DO NOT UPLOAD
│
├── api/
│   ├── order.js            ✅ Order submission
│   ├── menu.js             ✅ Menu management
│   └── order-status.js     ✅ Order status updates
│
├── DEPLOYMENT_GUIDE.md     ✅ This file
├── README.md               ✅ Project info
└── AIRTABLE_SETUP.md       ✅ Airtable setup info
```

---

## 🔧 TROUBLESHOOTING

**Order fails with "Network Error":**
- Environment variables not set in Vercel
- Check Vercel → Settings → Environment Variables

**Menu not showing:**
- Check Airtable tokens are correct
- Verify Menu Base ID matches your Airtable

**Kitchen/Admin not showing orders:**
- Verify Order Base ID is correct
- Check Airtable table names match exactly