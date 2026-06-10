# Color Dropper — Chrome Extension

A lightweight Chrome extension that lets you pick pixel-perfect colors from any webpage and instantly copy their HEX or RGB codes.

Built as a final project for [CS50x](https://cs50.harvard.edu/x/) — Harvard University's Introduction to Computer Science.

---

## Video Demo

<video width="640" controls>
  <source src="https://raw.githubusercontent.com/wrong-classroom1206/color-dropper-extension/master/color-dropper.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>   

---

## Description

Color Dropper is a browser extension that activates Chrome's native **EyeDropper API** to sample any color visible on your screen. Click the extension icon, hit **Pick a Color**, then click anywhere on the page — the exact pixel color is captured and displayed as both a HEX code and an RGB value, ready to copy with one click.

The extension also keeps a rolling history of your last 10 picked colors, persisted across browser sessions using `chrome.storage.local`, so you never lose a color you grabbed earlier.

---

## Features

- **Pixel-perfect color picking** using the native Chrome EyeDropper API
- **HEX and RGB output** displayed side by side
- **One-click copy** for both HEX and RGB values
- **Color history** — last 10 picked colors saved automatically and restored on next open
- **Click any history swatch** to reload a previous color
- Works on any standard webpage

---

## Project Structure

```
color-dropper-extension/
├── manifest.json     # Extension configuration (Manifest V3)
├── popup.html        # Extension popup UI
├── popup.js          # All logic: picking, copying, history
└── icon.png          # Extension icon
```

### `manifest.json`

Defines the extension's metadata and permissions under **Manifest V3** — Chrome's current extension standard. Declares four permissions:

- `activeTab` — access to the currently active tab
- `scripting` — ability to run scripts in page context (used as a fallback)
- `storage` — persist color history via `chrome.storage.local`
- `clipboardWrite` — allow writing picked color values to the clipboard

### `popup.html`

The UI rendered when the user clicks the extension icon. Contains:

- A **Pick a Color** button that triggers the dropper
- A **color preview box** that fills with the picked color
- Two **code rows** (HEX and RGB) each with an inline copy button
- A **history row** of swatches for recently picked colors
- A **status bar** for feedback messages (copied, cancelled, errors)

Styled entirely with plain CSS — no frameworks. Uses a dark theme (`#0f172a` base) with monospace font rendering for the color codes.

### `popup.js`

All the extension logic lives here, organized into four sections:

**Helpers** — `hexToRgb()` converts a HEX string to `rgb(r, g, b)` format. `setStatus()` shows timed feedback in the status bar. `copyToClipboard()` writes to the clipboard and toggles a green checkmark on the copy button.

**History** — `loadHistory()` and `saveHistory()` wrap `chrome.storage.local` in Promises for cleaner async usage. `addToHistory()` prepends the new color, deduplicates, and caps the list at 10. `renderHistory()` builds the swatch row from the saved array.

**Color display** — `applyColor()` updates the preview box and both code outputs from a single HEX value, keeping the UI in sync whether the source is a fresh pick or a history swatch click.

**Main pick handler** — Listens for the button click, calls `new EyeDropper().open()`, and handles the result. Gracefully catches user cancellation (Escape key) separately from real errors. Restores the button state in a `finally` block so it never gets stuck as disabled.

On boot, the script immediately loads history from storage and restores the most recently picked color into the preview — so the popup always opens in a useful state.

---

## Design Decisions

**Why the EyeDropper API instead of canvas injection?**

An earlier approach injected a transparent overlay `<div>` into the page, waited for a click, then read `getComputedStyle().backgroundColor` from the element under the cursor. This only returns the CSS background color of a DOM element — not the actual rendered pixel. It fails on images, gradients, canvas elements, SVGs, and any color that doesn't map directly to a single element's background.

The native [EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper) (Chrome 95+) reads the true rendered pixel at the cursor, works everywhere on screen including outside the browser window, and requires no DOM manipulation at all. It's the right tool for the job.

**Why `chrome.storage.local` instead of `localStorage`?**

Extension popups are destroyed and recreated each time they open — `localStorage` tied to the popup's origin would work, but `chrome.storage.local` is the idiomatic Chrome extension storage API. It persists reliably across popup open/close cycles, supports async access consistently, and is available from any extension context (popup, background, content scripts).

**Why no `manifest_version: 2`?**

Manifest V2 is deprecated and Chrome has been phasing out support since 2023. All new extensions should target Manifest V3, which enforces stricter security boundaries (no remote code execution, declarative net request rules, etc.).

---

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked** and select the project folder
5. The Color Dropper icon will appear in your Chrome toolbar

> **Note:** The EyeDropper API is only available in Chrome 95 and later. It is not supported in Firefox or Safari.

---

## Usage

1. Navigate to any standard webpage (`http://` or `https://`)
2. Click the Color Dropper icon in the Chrome toolbar
3. Click **Pick a Color**
4. Your cursor changes to Chrome's native color picker — click any pixel on the page
5. The HEX and RGB values appear in the popup
6. Click the copy icon next to either value to copy it to your clipboard
7. Previously picked colors appear as swatches at the bottom — click any to reload it

---

## Limitations

- Does not work on Chrome internal pages (`chrome://`, `chrome-extension://`) or the browser's New Tab page
- Requires Chrome 95 or later (EyeDropper API availability)
- Color history is local to the device and browser profile

---

## Technologies Used

- JavaScript (ES2022 — async/await, native browser APIs)
- Chrome Extensions API (Manifest V3)
- EyeDropper API
- `chrome.storage.local`
- `navigator.clipboard`
- HTML & CSS (no frameworks)

---

## Author

Built for CS50x Final Project submission.
