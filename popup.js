// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert a 6-digit HEX color string to an rgb(...) string.
 * e.g. "#1a2b3c" → "rgb(26, 43, 60)"
 */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Show a temporary status message beneath the swatches.
 */
function setStatus(msg, type = "") {
  const bar = document.getElementById("statusBar");
  bar.textContent = msg;
  bar.className = type;
  if (msg) setTimeout(() => { bar.textContent = ""; bar.className = ""; }, 2000);
}

/**
 * Copy text to clipboard and give visual feedback on the button.
 */
async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    btn.classList.add("copied");
    setTimeout(() => btn.classList.remove("copied"), 1200);
    setStatus("Copied!", "success");
  } catch {
    setStatus("Copy failed", "error");
  }
}

// ─── History ────────────────────────────────────────────────────────────────

const MAX_HISTORY = 10;

/** Load saved color history from chrome.storage.local */
async function loadHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get("colorHistory", (data) => {
      resolve(data.colorHistory || []);
    });
  });
}

/** Save updated history array to chrome.storage.local */
async function saveHistory(history) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ colorHistory: history }, resolve);
  });
}

/** Add a new hex color to the front of the history, capped at MAX_HISTORY */
async function addToHistory(hex) {
  let history = await loadHistory();
  history = [hex, ...history.filter((c) => c !== hex)].slice(0, MAX_HISTORY);
  await saveHistory(history);
  return history;
}

/** Render the history swatches row */
function renderHistory(history) {
  const row = document.getElementById("historyRow");
  row.innerHTML = "";

  if (!history.length) {
    row.innerHTML = '<span class="history-empty">No colors picked yet</span>';
    return;
  }

  history.forEach((hex) => {
    const swatch = document.createElement("div");
    swatch.className = "history-swatch";
    swatch.style.backgroundColor = hex;
    swatch.title = hex;
    swatch.addEventListener("click", () => applyColor(hex));
    row.appendChild(swatch);
  });
}

// ─── Color display ──────────────────────────────────────────────────────────

/** Update the preview box and code outputs for a given HEX value */
function applyColor(hex) {
  const rgb = hexToRgb(hex);
  document.getElementById("colorPreview").style.backgroundColor = hex;
  document.getElementById("hexOutput").textContent = hex.toUpperCase();
  document.getElementById("rgbOutput").textContent = rgb;
}

// ─── Main: pick color ───────────────────────────────────────────────────────

document.getElementById("pickBtn").addEventListener("click", async () => {
  const btn = document.getElementById("pickBtn");

  // Guard: EyeDropper is only available in Chrome 95+ on standard pages
  if (!window.EyeDropper) {
    setStatus("EyeDropper not supported in this browser.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Click any pixel…";
  setStatus("");

  try {
    const dropper = new EyeDropper();
    // This opens the native Chrome color-picker cursor.
    // The popup stays open while the user clicks anywhere on screen.
    const result = await dropper.open();   // { sRGBHex: "#rrggbb" }
    const hex = result.sRGBHex.toLowerCase();

    // Update UI
    applyColor(hex);

    // Save to history & re-render swatches
    const history = await addToHistory(hex);
    renderHistory(history);

    setStatus("Color picked!", "success");
  } catch (err) {
    // User pressed Escape — not a real error, just silently reset
    if (err.message && err.message.includes("canceled")) {
      setStatus("Cancelled.");
    } else {
      setStatus("Something went wrong.", "error");
    }
  } finally {
    btn.disabled = false;
    // Restore button label + icon
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2l3 3-9 9-3-3z"/>
        <path d="M3 17l-1 4 4-1z"/>
        <line x1="15" y1="5" x2="19" y2="9"/>
      </svg>
      Pick a Color`;
  }
});

// ─── Copy buttons ───────────────────────────────────────────────────────────

document.getElementById("copyHex").addEventListener("click", () => {
  const val = document.getElementById("hexOutput").textContent;
  if (val !== "—") copyToClipboard(val, document.getElementById("copyHex"));
});

document.getElementById("copyRgb").addEventListener("click", () => {
  const val = document.getElementById("rgbOutput").textContent;
  if (val !== "—") copyToClipboard(val, document.getElementById("copyRgb"));
});

// ─── Boot: load history on open ─────────────────────────────────────────────

(async () => {
  const history = await loadHistory();
  renderHistory(history);

  // Also restore last picked color into the preview, if any
  if (history.length) {
    applyColor(history[0]);
  }
})();
