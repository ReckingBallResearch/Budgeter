const { app, BrowserWindow, shell, Menu, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const { Anthropic } = require('@anthropic-ai/sdk');

// One window only, so two copies never write the same data at once.
if (!app.requestSingleInstanceLock()) app.quit();

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 380,
    title: 'Budgeter',
    backgroundColor: '#eef1f6',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  // Links open in the default browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); shell.openExternal(url); } });
  // Backups and calendar reminders: ask where to save, starting in Downloads.
  win.webContents.session.on('will-download', (e, item) => {
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), item.getFilename()) });
  });
}

/* ---------- Claude, for reading statement screenshots ---------- */
// The API key is encrypted with the macOS Keychain and never leaves the main process.
const keyFile = () => path.join(app.getPath('userData'), 'anthropic-key.bin');
function readKey() {
  try { return safeStorage.decryptString(fs.readFileSync(keyFile())); } catch (e) { return null; }
}
const fromApp = e => (e.senderFrame?.url || '').startsWith('file://');
function errCode(err) {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return { code: 'bad_key' };
  if (err instanceof Anthropic.RateLimitError) return { code: 'rate_limited' };
  if (err instanceof Anthropic.BadRequestError) return { code: 'bad_request', message: err.message };
  if (err instanceof Anthropic.APIConnectionError) return { code: 'offline' };
  return { code: 'upstream_error' };
}
const TX_SCHEMA = {
  type: 'object',
  properties: {
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { date: { type: 'string' }, description: { type: 'string' }, amount: { type: 'number' } },
        required: ['date', 'description', 'amount'],
        additionalProperties: false
      }
    }
  },
  required: ['transactions'],
  additionalProperties: false
};

ipcMain.handle('claude:hasKey', e => fromApp(e) && !!readKey());
ipcMain.handle('claude:setKey', async (e, key) => {
  if (!fromApp(e)) return { ok: false, code: 'bad_request' };
  key = String(key || '').trim();
  if (!key.startsWith('sk-ant-')) return { ok: false, code: 'bad_key' };
  try { await new Anthropic({ apiKey: key }).models.list({ limit: 1 }); }
  catch (err) { return { ok: false, ...errCode(err) }; }
  if (!safeStorage.isEncryptionAvailable()) return { ok: false, code: 'no_keychain' };
  fs.writeFileSync(keyFile(), safeStorage.encryptString(key), { mode: 0o600 });
  return { ok: true };
});
ipcMain.handle('claude:clearKey', e => { if (fromApp(e)) { try { fs.unlinkSync(keyFile()); } catch (err) {} } return true; });
ipcMain.handle('claude:read', async (e, req) => {
  const key = fromApp(e) && readKey();
  if (!key) return { ok: false, code: 'no_key' };
  const images = (req.images || []).map(i => ({ type: 'image', source: { type: 'base64', media_type: i.type, data: i.data } }));
  try {
    const res = await new Anthropic({ apiKey: key }).beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: TX_SCHEMA } },
      messages: [{ role: 'user', content: [...images, { type: 'text', text: String(req.prompt || '') }] }]
    });
    if (res.stop_reason === 'refusal') return { ok: false, code: 'refused' };
    if (res.stop_reason === 'max_tokens') return { ok: false, code: 'too_long' };
    const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
    try { return { ok: true, data: JSON.parse(text) }; } catch (err) { return { ok: false, code: 'invalid_json' }; }
  } catch (err) {
    return { ok: false, ...errCode(err) };
  }
});

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }
  ]));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
