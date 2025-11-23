import { app as s, BrowserWindow as i } from "electron";
import { fileURLToPath as c } from "node:url";
import o from "node:path";
const t = o.dirname(c(import.meta.url));
process.env.APP_ROOT = o.join(t, "..");
const n = process.env.VITE_DEV_SERVER_URL, R = o.join(process.env.APP_ROOT, "dist-electron"), r = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = n ? o.join(process.env.APP_ROOT, "public") : r;
let e;
function l() {
  e = new i({
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: o.join(t, "preload.mjs")
      // Security caution: consider contextIsolation: true and sandbox: true for production
      // Check: https://www.electronjs.org/docs/latest/tutorial/security#isolation-for-untrusted-content
    }
  }), n && e.webContents.openDevTools(), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), n ? e.loadURL(n) : e.loadFile(o.join(r, "index.html"));
}
s.on("window-all-closed", () => {
  process.platform !== "darwin" && (s.quit(), e = null);
});
s.on("activate", () => {
  i.getAllWindows().length === 0 && l();
});
s.whenReady().then(l);
export {
  R as MAIN_DIST,
  r as RENDERER_DIST,
  n as VITE_DEV_SERVER_URL
};
