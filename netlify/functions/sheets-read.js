const { getSheet, appendToSheet, updateSheet } = require('./sheets');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

const SHEET_NAMES = ['USERS', 'HABITS', 'DAILY_LOGS', 'MISSIONS', 'ANALYTICS', 'FOCUS_SESSIONS', 'ACHIEVEMENTS'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { httpMethod, queryStringParameters } = event;
    const path = event.path.replace('/.netlify/functions/sheets-read', '');
    const sheet = queryStringParameters?.sheet;

    if (httpMethod === 'GET' && sheet) {
      if (!SHEET_NAMES.includes(sheet)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid sheet name' }) };
      }
      const data = await getSheet(sheet);
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
