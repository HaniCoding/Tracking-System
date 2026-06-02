const db = require('./db');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

const VALID_SHEETS = ['USERS', 'HABITS', 'DAILY_LOGS', 'MISSIONS', 'ANALYTICS', 'FOCUS_SESSIONS', 'ACHIEVEMENTS'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const pathParts = event.path.split('/').filter(Boolean);
    const sheetsIdx = pathParts.indexOf('sheets');
    const action = sheetsIdx !== -1 && sheetsIdx < pathParts.length - 1
      ? pathParts[sheetsIdx + 1]
      : '';

    const query = event.queryStringParameters || {};
    const body = event.body ? (() => { try { return JSON.parse(event.body); } catch { return {}; } })() : {};

    if (action === 'read' && event.httpMethod === 'GET') {
      if (!query.sheet || !VALID_SHEETS.includes(query.sheet)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid or missing sheet name' }) };
      }
      const data = await db.readAll(query.sheet);
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (action === 'append' && event.httpMethod === 'POST') {
      if (!body.sheet || !body.row) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sheet name and row data required' }) };
      }
      await db.insertOne(body.sheet, body.row);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (action === 'write' && event.httpMethod === 'POST') {
      if (!body.sheet || !body.rows) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sheet name and rows required' }) };
      }
      const result = await db.replaceAll(body.sheet, body.rows);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: result }) };
    }

    if (action === 'update' && event.httpMethod === 'PUT') {
      if (!body.sheet || body.row === undefined || !body.data) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sheet name, row index, and data required' }) };
      }
      await db.updateByIndex(body.sheet, body.row, body.data);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (action === 'delete' && event.httpMethod === 'DELETE') {
      if (!query.sheet || query.row === undefined) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sheet name and row index required' }) };
      }
      await db.deleteByIndex(query.sheet, parseInt(query.row, 10));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (action === 'sync-check' && event.httpMethod === 'GET') {
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: `Not found: ${action}` }) };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
