const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');

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

/* ---------- local AI through Ollama, for reading statements and talking about spending ---------- */
// Everything stays on this Mac: Ollama runs the model locally on its default port.
const OLLAMA = process.env.OLLAMA_HOST ? `http://${process.env.OLLAMA_HOST.replace(/^https?:\/\//, '')}` : 'http://127.0.0.1:11434';
const fromApp = e => (e.senderFrame?.url || '').startsWith('file://');

async function ollama(route, body, timeoutMs = 300000) {
  let res;
  try {
    res = await fetch(OLLAMA + route, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    throw { code: err.name === 'TimeoutError' ? 'timeout' : 'offline' };
  }
  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))).error || res.statusText;
    throw { code: res.status === 404 ? 'no_model' : 'ai_error', message: msg };
  }
  return res;
}
const fail = err => ({ ok: false, code: err.code || 'ai_error', message: err.message || '' });

ipcMain.handle('ai:status', async e => {
  if (!fromApp(e)) return { running: false, models: [] };
  try {
    const r = await (await ollama('/api/tags', null, 3000)).json();
    return { running: true, models: (r.models || []).map(m => m.name) };
  } catch (err) { return { running: false, models: [] }; }
});

// One answer as JSON, shaped by `schema`; images are base64 strings.
ipcMain.handle('ai:json', async (e, req) => {
  if (!fromApp(e)) return { ok: false, code: 'ai_error' };
  try {
    const res = await ollama('/api/chat', {
      model: req.model, stream: false, format: req.schema,
      options: { temperature: 0, num_ctx: req.ctx || 8192 },
      messages: [{ role: 'user', content: String(req.prompt || ''), images: req.images?.length ? req.images : undefined }]
    });
    const out = await res.json();
    try { return { ok: true, data: JSON.parse(out.message?.content || '') }; } catch (err) { return { ok: false, code: 'invalid_json' }; }
  } catch (err) { return fail(err); }
});

// A chat answer, streamed back to the page as it's written.
const asks = new Map();
ipcMain.handle('ai:ask', async (e, req) => {
  if (!fromApp(e)) return { ok: false, code: 'ai_error' };
  const ctl = new AbortController();
  asks.set(req.id, ctl);
  try {
    const res = await ollama('/api/chat', { model: req.model, stream: true, options: { temperature: 0.3, num_ctx: req.ctx || 16384 }, messages: req.messages });
    const dec = new TextDecoder();
    let buf = '', text = '';
    for await (const chunk of res.body) {
      if (ctl.signal.aborted) break;
      buf += dec.decode(chunk, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line) continue;
        const m = JSON.parse(line);
        if (m.error) throw { code: 'ai_error', message: m.error };
        if (m.message?.content) { text += m.message.content; e.sender.send('ai:chunk', { id: req.id, text }); }
      }
    }
    return ctl.signal.aborted ? { ok: false, code: 'cancelled', text } : { ok: true, text };
  } catch (err) { return fail(err); }
  finally { asks.delete(req.id); }
});
ipcMain.handle('ai:stop', (e, id) => { asks.get(id)?.abort(); return true; });

// Text of a PDF, one string per page, with each line's pieces in reading order.
let pdfjs;
ipcMain.handle('pdf:text', async (e, bytes) => {
  if (!fromApp(e)) return { ok: false, code: 'pdf_error' };
  try {
    pdfjs = pdfjs || await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task = pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useSystemFonts: true });
    const doc = await task.promise;
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const items = (await (await doc.getPage(n)).getTextContent()).items.filter(i => i.str && i.str.trim());
      const lines = [];
      for (const i of items) {
        const x = i.transform[4], y = i.transform[5];
        let line = lines.find(l => Math.abs(l.y - y) < Math.max(2, (i.height || 8) * 0.4));
        if (!line) lines.push(line = { y, parts: [] });
        line.parts.push({ x, s: i.str });
      }
      lines.sort((a, b) => b.y - a.y);
      pages.push(lines.map(l => l.parts.sort((a, b) => a.x - b.x).map(p => p.s.trim()).join('  ')).join('\n'));
    }
    await task.destroy();
    return { ok: true, pages };
  } catch (err) {
    return { ok: false, code: err.name === 'PasswordException' ? 'pdf_locked' : 'pdf_error', message: String(err.message || err) };
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
