/**
 * Vercel Serverless Function for Order & Event Submission
 * Handles creating orders with individual order items and event bookings
 * 
 * POST - Create order (with order items) or event booking
 * 
 * Security: Uses AIRTABLE_API_TOKEN_WRITE + AIRTABLE_ORDER_BASE_ID
 * Orders and Order Items must be in the SAME base for linking to work.
 */

// Use dedicated order base ID, fallback to common base ID for backward compatibility
const AIRTABLE_BASE_ID = process.env.AIRTABLE_ORDER_BASE_ID || process.env.AIRTABLE_BASE_ID;
// Use dedicated write token, fallback to common token for backward compatibility
const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN_WRITE || process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_ORDERS_TABLE = process.env.AIRTABLE_ORDERS_TABLE || 'Orders Details';
const AIRTABLE_ORDER_ITEMS_TABLE = process.env.AIRTABLE_ORDER_ITEMS_TABLE || 'Order Items';
const AIRTABLE_EVENTS_TABLE = process.env.AIRTABLE_EVENTS_TABLE || 'Event Bookings';
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

module.exports = async function handler(req, res) {
  // Set CORS headers for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_TOKEN) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data in request body' });
    }

    let table, fields;

    if (type === 'order') {
      // Validate required order fields
      if (!data.customerName || !data.tableNumber || !data.orderedItems) {
        return res.status(400).json({ error: 'Missing required order fields' });
      }

      table = AIRTABLE_ORDERS_TABLE;
      fields = {
        'Customer Name': data.customerName,
        'Table Number': data.tableNumber,
        'Ordered Items': data.orderedItems,
        'Total Amount': parseFloat(data.totalAmount) || 0,
        'Order Status': 'Pending',
        'Notes Request': data.notes || 'None',
        'Order Timestamp': new Date().toISOString()
      };

      // Add Order ID if provided
      if (data.orderId) {
        fields['Order Id'] = data.orderId;
      }
    } else if (type === 'event') {
      // Validate required event fields
      const requiredFields = ['eventType', 'eventDate', 'roomPackage', 'numRooms', 'budgetRange', 'leadName', 'email', 'phone'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return res.status(400).json({ error: `Missing required field: ${field}` });
        }
      }

      table = AIRTABLE_EVENTS_TABLE;
      fields = {
        'Event Type': data.eventType,
        'Event Date': data.eventDate,
        'Room Package': data.roomPackage,
        'Number of Rooms': parseInt(data.numRooms),
        'Budget Range': data.budgetRange,
        'Lead Name': data.leadName,
        'Email': data.email,
        'Phone': data.phone,
        'Catering Preferences': data.cateringPreferences || 'No specific preferences',
        'Special Requests': data.specialRequests || 'None',
        'Valet Parking': data.valetParking === true,
        'Reserved Parking': data.reservedParking === true,
        'Parking Count': parseInt(data.parkingCount) || 0,
        'Status': 'Pending',
        'Booking Timestamp': new Date().toISOString()
      };
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "order" or "event"' });
    }

    // Send request to Airtable API
    const response = await fetch(`${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields }] })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Airtable API error:', response.status, errorBody);
      return res.status(response.status).json({ error: 'Failed to save to Airtable' });
    }

    const result = await response.json();
    const orderRecordId = result.records[0].id;

    // If this is an order, also create individual Order Items records for kitchen tracking
    // Order Items must be in the SAME base as Orders Details for linking to work
    if (type === 'order' && data.items && data.items.length > 0) {
      const itemRecords = data.items.map(item => ({
        fields: {
          'Order': [orderRecordId],
          'Dish Name': item.name,
          'Variant': item.variant || 'Full',
          'Quantity': item.qty || 1,
          'Item Status': 'Pending',
          'Notes': data.notes || ''
          // 'Created Time' is auto-computed by Airtable, don't set it
        }
      }));

      // Create items in batches of 10 (Airtable limit)
      for (let i = 0; i < itemRecords.length; i += 10) {
        const batch = itemRecords.slice(i, i + 10);
        await fetch(`${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ORDER_ITEMS_TABLE)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ records: batch })
        });
      }
    }

    return res.status(200).json({ success: true, recordId: orderRecordId });

  } catch (error) {
    console.error('Server error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};