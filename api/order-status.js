/**
 * Vercel Serverless Function for Order Status Updates & Fetching
 * Handles updating order status, individual item status, and fetching orders for kitchen
 * 
 * GET   - Fetch all orders (with optional status filter)
 * PATCH - Update order status or individual item status
 * 
 * Security: Uses AIRTABLE_API_TOKEN_WRITE for GET/PATCH + AIRTABLE_ORDER_BASE_ID
 * Falls back to AIRTABLE_API_TOKEN and AIRTABLE_BASE_ID for backward compatibility
 */

// Use dedicated order base ID, fallback to common base ID for backward compatibility
const AIRTABLE_BASE_ID = process.env.AIRTABLE_ORDER_BASE_ID || process.env.AIRTABLE_BASE_ID;
// Use dedicated write token, fallback to common token for backward compatibility
const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN_WRITE || process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_ORDERS_TABLE = process.env.AIRTABLE_ORDERS_TABLE || 'Orders Details';
const AIRTABLE_ORDER_ITEMS_TABLE = process.env.AIRTABLE_ORDER_ITEMS_TABLE || 'Order Items';
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // GET - Fetch all orders for kitchen/admin
    if (req.method === 'GET') {
      const { status, limit } = req.query;
      let filterByFormula = '';
      
      if (status) {
        const statusList = status.split(',');
        if (statusList.length === 1) {
          filterByFormula = `{Order Status} = '${statusList[0]}'`;
        } else {
          filterByFormula = `OR(${statusList.map(s => `{Order Status} = '${s}'`).join(', ')})`;
        }
      }

      const params = new URLSearchParams();
      if (filterByFormula) params.set('filterByFormula', filterByFormula);
      if (limit) params.set('pageSize', limit);
      else params.set('pageSize', '100');
      // Sort by newest first
      params.set('sort[0][field]', 'Order Timestamp');
      params.set('sort[0][direction]', 'desc');

      const response = await fetch(
        `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ORDERS_TABLE)}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Airtable GET error:', response.status, errorBody);
        return res.status(response.status).json({ error: 'Failed to fetch orders' });
      }

      const data = await response.json();
      const orders = data.records.map(record => ({
        id: record.id,
        ...(record.fields || {})
      }));

      // Also fetch order items (must be same base as orders for link field to work)
      const itemsParams = new URLSearchParams();
      itemsParams.set('pageSize', '200');
      itemsParams.set('sort[0][field]', 'Created Time');
      itemsParams.set('sort[0][direction]', 'asc');
      const itemsResponse = await fetch(
        `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ORDER_ITEMS_TABLE)}?${itemsParams}`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`
          }
        }
      );

      let orderItems = [];
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        orderItems = itemsData.records.map(record => ({
          id: record.id,
          ...(record.fields || {})
        }));
      }

      return res.status(200).json({ 
        success: true, 
        orders,
        orderItems,
        hasMore: data.offset ? true : false
      });
    }

    // PATCH - Update order status or item status
    if (req.method === 'PATCH') {
      const { updateType, recordId, fields } = req.body;

      if (!updateType || !recordId) {
        return res.status(400).json({ error: 'updateType and recordId are required' });
      }

      let table;
      if (updateType === 'order') {
        table = AIRTABLE_ORDERS_TABLE;
      } else if (updateType === 'item') {
        table = AIRTABLE_ORDER_ITEMS_TABLE;
      } else {
        return res.status(400).json({ error: 'Invalid updateType. Use "order" or "item"' });
      }

      const airtableFields = {};
      if (updateType === 'order') {
        if (fields.status) airtableFields['Order Status'] = fields.status;
        if (fields.kitchenNotes) airtableFields['Kitchen Notes'] = fields.kitchenNotes;
      } else {
        if (fields.status) airtableFields['Item Status'] = fields.status;
        if (fields.preparedTime) airtableFields['Prepared Time'] = fields.preparedTime;
      }

      const response = await fetch(
        `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}/${recordId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields: airtableFields })
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Airtable PATCH error:', response.status, errorBody);
        return res.status(response.status).json({ error: 'Failed to update status' });
      }

      const result = await response.json();
      
      // If updating an item to "Prepared", check if all items in the order are prepared
      // and auto-update order status to "Ready"
      if (updateType === 'item' && fields.status === 'Prepared') {
        await checkAndUpdateOrderStatus(recordId);
      }

      return res.status(200).json({ success: true, record: result });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Order Status API error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Helper: Check if all items in an order are prepared
 * If yes, update the order status to "Ready"
 */
async function checkAndUpdateOrderStatus(itemRecordId) {
  try {
    // Fetch this item to get its linked order
    const itemResponse = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ORDER_ITEMS_TABLE)}/${itemRecordId}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`
        }
      }
    );

    if (!itemResponse.ok) return;

    const itemData = await itemResponse.json();
    const orderLink = itemData.fields['Order'];
    
    if (!orderLink || orderLink.length === 0) return;
    
    // Get all items for this order
    const orderFilter = `{Order} = '${orderLink[0]}'`;
    const itemsResponse = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ORDER_ITEMS_TABLE)}?${new URLSearchParams({ filterByFormula: orderFilter })}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`
        }
      }
    );

    if (!itemsResponse.ok) return;

    const itemsData = await itemsResponse.json();
    const items = itemsData.records;
    
    // Check if ALL items are Prepared
    const allPrepared = items.every(item => item.fields['Item Status'] === 'Prepared' || item.fields['Item Status'] === 'Served');
    
    if (allPrepared) {
      // Update order status to Ready
      await fetch(
        `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_ORDERS_TABLE)}/${orderLink[0]}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields: { 'Order Status': 'Ready' } })
        }
      );
    }
  } catch (error) {
    console.error('Auto-status check error:', error.message);
  }
}