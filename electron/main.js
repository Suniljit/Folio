const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";
const PORT = isDev ? 8000 : 8756;

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  if (isDev) {
    // In dev mode, the backend is already running (spawned by `concurrently`
    // via the electron:dev npm script), so there's nothing to spawn here.
    return;
  }

  // When packaged, electron-builder's extraResources copies the PyInstaller
  // output next to the app's resources. When running unpackaged (e.g. `electron .`
  // during local testing), fall back to the repo's own dist/ output.
  const backendDir = app.isPackaged
    ? path.join(process.resourcesPath, "folio-backend")
    : path.join(__dirname, "..", "dist", "folio-backend");
  const backendExe = path.join(backendDir, "folio-backend");
  const dataDir = app.getPath("userData");

  backendProcess = spawn(backendExe, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      FOLIO_DATA_DIR: dataDir,
      FOLIO_PORT: String(PORT),
    },
  });

  backendProcess.stdout.on("data", (data) => console.log(`[backend] ${data}`));
  backendProcess.stderr.on("data", (data) => console.error(`[backend] ${data}`));
}

function waitForHealth(url, timeoutMs = 15000, intervalMs = 200) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    function check() {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", retry);
    }

    function retry() {
      if (Date.now() > deadline) {
        reject(new Error(`Backend did not become healthy within ${timeoutMs}ms`));
        return;
      }
      setTimeout(check, intervalMs);
    }

    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  const url = isDev ? "http://localhost:5173" : `http://127.0.0.1:${PORT}`;
  mainWindow.loadURL(url);
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill("SIGKILL");
      }
    }, 3000);
    backendProcess = null;
  }
}

app.whenReady().then(async () => {
  startBackend();
  try {
    await waitForHealth(`http://127.0.0.1:${PORT}/health`, 30000);
    createWindow();
  } catch (err) {
    console.error(err);
    stopBackend();
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", stopBackend);
