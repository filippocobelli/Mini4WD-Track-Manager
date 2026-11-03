// Mini4WD Track Planner desktop window: loads the offline version in /desktop.
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 640,
    title: `Mini4WD Track Planner ${app.getVersion()}`,
    backgroundColor: "#e8ecf0",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  win.loadFile(path.join(__dirname, "..", "desktop", "index.html"));
  // External links (MakerWorld etc.) open in the browser, not inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://")) { e.preventDefault(); shell.openExternal(url); }
  });
  win.on("page-title-updated", e => e.preventDefault());
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
