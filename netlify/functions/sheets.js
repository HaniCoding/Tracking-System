const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let authClient = null;

async function getAuthClient() {
  if (authClient) return authClient;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  authClient = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    key,
    SCOPES
  );
  await authClient.authorize();
  return authClient;
}

async function getSheetsAPI() {
  const auth = await getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

async function getSheet(sheetName) {
  const sheets = await getSheetsAPI();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: `${sheetName}!A:Z`,
  });
  return res.data.values || [];
}

async function appendToSheet(sheetName, values) {
  const sheets = await getSheetsAPI();
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] },
  });
  return res.data;
}

async function updateSheet(sheetName, range, values) {
  const sheets = await getSheetsAPI();
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: `${sheetName}!${range}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: Array.isArray(values[0]) ? values : [values] },
  });
  return res.data;
}

module.exports = { getSheet, appendToSheet, updateSheet };
