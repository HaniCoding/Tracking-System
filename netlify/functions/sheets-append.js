const { appendToSheet } = require('./sheets');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { sheet, row } = JSON.parse(event.body || '{}');

    if (!sheet || !row) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sheet name and row data required' }) };
    }

    const result = await appendToSheet(sheet, row);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, data: result }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
