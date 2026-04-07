/**
 * Vercel Serverless Function for Menu Management (Admin Panel)
 * Handles CRUD operations for Menu Items in Airtable
 * 
 * GET  - Fetch all menu items (with optional filters)
 * POST - Create or update menu items
 * PATCH - Update a specific menu item
 * 
 * Security: Uses AIRTABLE_API_TOKEN_WRITE for all operations (requires write access)
 */

// Use dedicated menu base ID, fallback to common base ID for backward compatibility
const AIRTABLE_BASE_ID = process.env.AIRTABLE_MENU_BASE_ID || process.env.AIRTABLE_BASE_ID;
// Use dedicated menu token, fallback to write token, then common token
const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN_MENU || process.env.AIRTABLE_API_TOKEN_WRITE || process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_MENU_TABLE = process.env.AIRTABLE_MENU_TABLE || 'Menu Items';
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // GET - Fetch menu items (uses write token for consistency, read-only token could be added)
    if (req.method === 'GET') {
      const { category, inStock } = req.query;
      let filterByFormula = '';
      
      if (category && category !== 'all') {
        filterByFormula = `{Category} = '${decodeURIComponent(category)}'`;
      }
      if (inStock === 'true') {
        const additionalFilter = `{In Stock} = TRUE()`;
        filterByFormula = filterByFormula ? `AND(${filterByFormula}, ${additionalFilter})` : additionalFilter;
      }

      const params = new URLSearchParams();
      if (filterByFormula) params.set('filterByFormula', filterByFormula);
      params.set('pageSize', '100');
      params.set('sort[0][field]', 'Category');
      params.set('sort[0][direction]', 'asc');

      const response = await fetch(
        `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_MENU_TABLE)}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Airtable GET error:', response.status, errorBody);
        return res.status(response.status).json({ error: 'Failed to fetch menu' });
      }

      const data = await response.json();
      const items = data.records.map(record => ({
        id: record.id,
        ...(record.fields || {})
      }));

      return res.status(200).json({ success: true, items });
    }

    // POST - Create new menu item (requires write access)
    if (req.method === 'POST') {
      const body = req.body;

      if (!body.name || !body.price) {
        return res.status(400).json({ error: 'Name and price are required' });
      }

      const fields = {
        'Name': body.name,
        'Description': body.description || '',
        'Full Price': parseFloat(body.price) || 0,
        'Half Price': body.halfPrice ? parseFloat(body.halfPrice) : null,
        'Category': body.category || 'starters',
        'Is Veg': body.isVeg === true,
        'Is Popular': body.isPopular === true,
        'Is Chef Special': body.isChefSpecial === true,
        'In Stock': body.inStock !== false,
        'Image URL': body.imageUrl || ''
      };

      const response = await fetch(
        `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_MENU_TABLE)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ records: [{ fields }] })
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Airtable POST error:', response.status, errorBody);
        return res.status(response.status).json({ error: 'Failed to create menu item' });
      }

      const result = await response.json();
      return res.status(200).json({ success: true, record: result.records[0] });
    }

    // PATCH - Update menu item (requires write access)
    if (req.method === 'PATCH') {
      const { id, fields } = req.body;

      if (!id || !fields) {
        return res.status(400).json({ error: 'Record ID and fields are required' });
      }

      const airtableFields = {};
      if (fields.name !== undefined) airtableFields['Name'] = fields.name;
      if (fields.description !== undefined) airtableFields['Description'] = fields.description;
      if (fields.price !== undefined) airtableFields['Full Price'] = parseFloat(fields.price);
      if (fields.halfPrice !== undefined) airtableFields['Half Price'] = fields.halfPrice ? parseFloat(fields.halfPrice) : null;
      if (fields.category !== undefined) airtableFields['Category'] = fields.category;
      if (fields.isVeg !== undefined) airtableFields['Is Veg'] = fields.isVeg;
      if (fields.isPopular !== undefined) airtableFields['Is Popular'] = fields.isPopular;
      if (fields.isChefSpecial !== undefined) airtableFields['Is Chef Special'] = fields.isChefSpecial;
      if (fields.inStock !== undefined) airtableFields['In Stock'] = fields.inStock;
      if (fields.imageUrl !== undefined) airtableFields['Image URL'] = fields.imageUrl;

      const response = await fetch(
        `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_MENU_TABLE)}/${id}`,
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
        return res.status(response.status).json({ error: 'Failed to update menu item' });
      }

      const result = await response.json();
      return res.status(200).json({ success: true, record: result });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Menu API error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};