// ─────────────────────────────────────────────────────────────────────────────
// sheetsApi.js  —  All Google Sheets data operations
// Uses Google Sheets API v4 as the "database"
// Sheet structure:
//   Tab "accounts"     : id | name | type | currency | initialBalance | creditLimit | alertEnabled | alertThreshold | notes | createdAt
//   Tab "transactions" : id | date | description | category | txType | debitAccount | creditAccount | amount | currency | status | beneficiary | notes | createdAt
//   Tab "savings"      : id | name | icon | targetAmount | currentAmount | currency | targetDate | monthlyContrib | annualRate | notes | createdAt
//   Tab "settings"     : key | value
// ─────────────────────────────────────────────────────────────────────────────

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file openid email profile';
const DISCOVERY = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Sheet tab definitions
export const TABS = {
  accounts:     { name: 'accounts',     headers: ['id','name','type','currency','initialBalance','creditLimit','alertEnabled','alertThreshold','notes','createdAt'] },
  transactions: { name: 'transactions', headers: ['id','date','description','category','txType','debitAccount','creditAccount','amount','currency','status','beneficiary','notes','createdAt'] },
  savings:      { name: 'savings',      headers: ['id','name','icon','targetAmount','currentAmount','currency','targetDate','monthlyContrib','annualRate','notes','createdAt'] },
  settings:     { name: 'settings',     headers: ['key','value'] },
};

// ── ID generation ─────────────────────────────────────────────────────────
export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// ── Row ↔ Object conversion ───────────────────────────────────────────────
const rowToObj = (headers, row) => {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
  return obj;
};
const objToRow = (headers, obj) => headers.map(h => obj[h] ?? '');

// ── Main API class ────────────────────────────────────────────────────────
class SheetsDB {
  constructor() {
    this.spreadsheetId = null;
    this.cache = {};       // { tabName: [rows] }
    this.cacheTime = {};
    this.CACHE_MS = 10000; // 10s cache
  }

  setSpreadsheetId(id) { this.spreadsheetId = id; this.cache = {}; }

  // ── Initialize: create tabs + headers if missing ────────────────────────
  async init(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
    const existingTabs = meta.result.sheets.map(s => s.properties.title);

    const requests = [];
    for (const [, tabDef] of Object.entries(TABS)) {
      if (!existingTabs.includes(tabDef.name)) {
        requests.push({ addSheet: { properties: { title: tabDef.name } } });
      }
    }
    if (requests.length > 0) {
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests },
      });
    }

    // Write headers for each tab if row 1 is empty
    for (const [, tabDef] of Object.entries(TABS)) {
      const range = `${tabDef.name}!A1:Z1`;
      const resp = await window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range });
      if (!resp.result.values || resp.result.values.length === 0) {
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId, range,
          valueInputOption: 'RAW',
          resource: { values: [tabDef.headers] },
        });
      }
    }
    this.cache = {};
  }

  // ── Read all rows from a tab ────────────────────────────────────────────
  async readAll(tabName) {
    const now = Date.now();
    if (this.cache[tabName] && now - this.cacheTime[tabName] < this.CACHE_MS) {
      return this.cache[tabName];
    }
    const tab = TABS[tabName];
    const range = `${tabName}!A2:Z10000`;
    const resp = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId, range,
    });
    const rows = (resp.result.values || []).map(row => rowToObj(tab.headers, row));
    this.cache[tabName] = rows;
    this.cacheTime[tabName] = now;
    return rows;
  }

  // ── Append a new row ────────────────────────────────────────────────────
  async append(tabName, obj) {
    const tab = TABS[tabName];
    const row = objToRow(tab.headers, { ...obj, createdAt: new Date().toISOString() });
    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });
    delete this.cache[tabName];
    return obj;
  }

  // ── Find row number (1-indexed, including header) for an id ────────────
  async _findRowNum(tabName, id) {
    const tab = TABS[tabName];
    const idIdx = tab.headers.indexOf('id');
    const range = `${tabName}!A2:A10000`;
    const resp = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId, range,
    });
    const rows = resp.result.values || [];
    const idx = rows.findIndex(r => r[idIdx] === id || r[0] === id);
    if (idx === -1) throw new Error(`Row ${id} not found in ${tabName}`);
    return idx + 2; // +1 for header, +1 for 0-index
  }

  // ── Update a row by id ──────────────────────────────────────────────────
  async update(tabName, id, updates) {
    const tab = TABS[tabName];
    // Read current row
    const all = await this.readAll(tabName);
    const current = all.find(r => r.id === id);
    if (!current) throw new Error(`Not found: ${id}`);
    const merged = { ...current, ...updates };
    const rowNum = await this._findRowNum(tabName, id);
    const range = `${tabName}!A${rowNum}:Z${rowNum}`;
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId, range,
      valueInputOption: 'RAW',
      resource: { values: [objToRow(tab.headers, merged)] },
    });
    delete this.cache[tabName];
  }

  // ── Delete a row by id ──────────────────────────────────────────────────
  async delete(tabName, id) {
    const rowNum = await this._findRowNum(tabName, id);
    // Get sheet id for the tab
    const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    const sheet = meta.result.sheets.find(s => s.properties.title === tabName);
    if (!sheet) throw new Error(`Sheet ${tabName} not found`);
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowNum - 1,
              endIndex: rowNum,
            },
          },
        }],
      },
    });
    delete this.cache[tabName];
  }

  // ── Settings helpers ────────────────────────────────────────────────────
  async getSetting(key) {
    const rows = await this.readAll('settings');
    return rows.find(r => r.key === key)?.value ?? null;
  }

  async setSetting(key, value) {
    const rows = await this.readAll('settings');
    const existing = rows.find(r => r.key === key);
    if (existing) {
      await this.update('settings', existing.id, { value: String(value) });
    } else {
      await this.append('settings', { id: genId(), key, value: String(value) });
    }
  }
}

export const db = new SheetsDB();

// ── Google Auth + GAPI loader ─────────────────────────────────────────────
export const loadGapi = () => new Promise((resolve, reject) => {
  const check = () => {
    if (window.gapi) {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: [DISCOVERY],
          });
          resolve();
        } catch (e) { reject(e); }
      });
    } else {
      setTimeout(check, 200);
    }
  };
  check();
});

export const initGoogleAuth = (clientId) => new Promise((resolve, reject) => {
  const check = () => {
    if (window.google?.accounts?.oauth2) {
      resolve(window.google.accounts.oauth2);
    } else {
      setTimeout(check, 200);
    }
  };
  check();
});

// Token client (set once)
let tokenClient = null;
let accessToken = null;

export const signIn = (clientId) => new Promise((resolve, reject) => {
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) { reject(resp); return; }
        accessToken = resp.access_token;
        window.gapi.client.setToken({ access_token: accessToken });
        resolve(resp);
      },
    });
  }
  tokenClient.requestAccessToken();
});

export const signOut = () => {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = null;
    window.gapi.client.setToken(null);
  }
};

export const getAccessToken = () => accessToken;
