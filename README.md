# °∆ Sepulchral{NX} ∆° - MINDWEAVER
> **Cybernetic Timeline Storyboard & Incident Forensics Detective Board**

---

`°∆ Sepulchral{NX} ∆° - MINDWEAVER` is an advanced, high-fidelity investigative storyboard and incident chronology matrix designed for digital forensics, incident response, investigative journalism, cyber intelligence, and narrative case analysis. 

Equipped with an interactive spatial canvas, evidence wiring physics, quick-command operational schemes, a local AI incident chronology parser (Ollama LLM), snapshot state branches, and tactile acoustic feedback, Mindweaver transforms raw case logs into a structured investigative timeline.

## Standalone Windows Desktop App

The `Mindweaver-Desktop-1.7.0-x64.zip` package contains `win-unpacked/Mindweaver.exe` and its support files. Extract the entire ZIP, keep the folder together, then run `Mindweaver.exe`. It opens in its own window with a custom Mindweaver icon and does not need Node.js, a browser tab, or a localhost server. Earlier one-file EXEs remain separate builds; this ZIP is not a one-file installer.

The desktop app has its own saved workspace. Upgrading from an older desktop build copies its existing board into page 1 automatically and leaves the older save keys untouched. Export a full workspace backup before upgrading as an extra safeguard. If moving from the browser version instead, use **CASES → Restore Full Workspace Backup** with its JSON backup; restoring replaces all ten desktop pages after confirmation. Browser and desktop saves remain separate.

The desktop app stores its profile under `%APPDATA%\SepulchralNX\Mindweaver`. Ollama is optional and, when used, is reached on this PC. This early desktop build is not digitally signed; Windows may show an unknown publisher prompt.

### Node images and local board intelligence

Open an existing event node and use **NODE IMAGE // OPTIONAL** to attach one PNG, JPEG, WebP, or GIF (up to 10 MB). The image appears in the dossier and as a small card thumbnail. It is stored locally in the app's browser-profile image store; the node record holds only its image ID. Case JSON and full-workspace backups include the image bytes so they can be restored on another installation. Removing an image from a node does not delete the original file on your PC. Older backups still import.

Use **ANALYZE / CHAT** in the top bar for read-only convergence analysis and questions about the current board. It sends event text and connection metadata to your local Ollama model only; attached image pixels are not sent. AI replies do not edit nodes or turn hypotheses into evidence. Chat is session-only. **Read aloud** uses an installed local English voice when available and obeys the app's SOUND toggle; no cloud speech service is required.

## Windows Quick Start

Mindweaver now runs as a local browser app on Windows 10 or 11. It binds only to this PC; it does not create an online account or upload boards to a cloud service.

1. Install the current [Node.js LTS](https://nodejs.org/) release if it is not already installed.
2. Extract the ZIP into the folder where you want to keep Mindweaver. The shortcut points to this folder, so choose its permanent location first.
3. Double-click **`Install-Mindweaver.cmd`** once. This installs the project packages, checks the TypeScript, makes a production build, and offers to create a **Mindweaver** desktop shortcut.
4. Open the desktop shortcut or double-click **`Start-Mindweaver.cmd`** whenever you want to use Mindweaver. Keep its console window open while using the app.
5. The app opens at `http://localhost:3000`. Closing the console stops the local server.

If a second launch says port 3000 is already in use, Mindweaver may already be running. Open `http://localhost:3000` in your browser. To start a different copy, stop the first copy from its console with **Ctrl+C** before launching the other one.

Ollama is optional. The board, manual editing, snapshots, and JSON import/export work without it. To use **Local AI Autofill**, install and start Ollama separately and make sure at least one model is available at `http://localhost:11434`.

### Where progress is saved

Mindweaver automatically saves the active board, snapshots, project folders, theme, visual settings, and node images in the browser profile for `localhost:3000`. Clearing that browser's site data removes those automatic saves. Use **CASES → Export Full Workspace Backup** for durable protection and **Restore Full Workspace Backup** to recover it. The separate case JSON options remain available when you only need one board.

---

## ⚡ Quick Key Commands (Operational Schemes)

Switch between ten independent projects with `Alt + 1` through `Alt + 9`, then `Alt + 0` for page 10, or use the toolbar **PROJECT PAGES** picker. Each page has its own board, folders, snapshots, and visual settings:

| Hotkey | Operational Scheme | Classification | Primary Color | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`Alt + 1`** | **NIGHTFLY** | Orbital | `#05ffa1` Emerald | Existing board migrates here. |
| **`Alt + 2`** | **THE M.I.R.E.** | Industrial | `#ffb000` Amber | New independent project. |
| **`Alt + 3`** | **NEPHILA** | Neural | `#c084fc` Purple | New independent project. |
| **`Alt + 4`** | **SEPULCHRE** | Archive | `#ffffff` White | New independent project. |
| **`Alt + 5`** | **SEPULCHRAL{NX}** | Tactical | `#ef4444` Red | New independent project. |
| **`Alt + 6`** | **GHOSTLINE** | Signal | `#22d3ee` Cyan | New independent project. |
| **`Alt + 7`** | **EMBER** | Field | `#fb923c` Orange | New independent project. |
| **`Alt + 8`** | **DEEPFIELD** | Observation | `#60a5fa` Blue | New independent project. |
| **`Alt + 9`** | **AFTERGLOW** | Analysis | `#f472b6` Pink | New independent project. |
| **`Alt + 0`** | **VERDIGRIS** | Archive | `#a3e635` Lime | New independent project (page 10). |

---

## 🕹️ Board Navigation & Canvas Controls

The spatial matrix canvas supports intuitive navigation for complex, multi-branch cases:

* **Drag Board / Pan Tool (`DRAG BOARD` in toolbar or spacebar pan)**: Click and drag anywhere across the canvas to glide smoothly across the entire investigation board. Auto-releases without getting stuck.
* **Push & Pull Right-Click Zoom**: Hold the **Right Mouse Button (RMB)** and push up to zoom in, or pull down to zoom out with real-time radial visual reticle feedback.
* **Mouse Wheel Zoom**: Scroll to zoom in and out. Features a **dedicated toggle switch** (available both on the top toolbar and directly on the floating board HUD) to enable or disable wheel zooming based on trackpad/mouse preference.
* **Quick Center Jump (`Keys 1 through 0`)**: Press number keys `1` through `0` on your keyboard to instantly pan and center directly onto key root/starting nodes.
* **Reset View (`MAXIMIZE` icon)**: Instantly resets canvas zoom to 100% and centers the grid origin.
* **Floating time tags (`TIME TAG`)**: Add a timestamp or time range anywhere on the board. Drag the tag to move it; hover and drag any edge to resize it from 8–48 px. Its chosen on-screen size remains fixed as the board zooms. Use the pencil to edit text/type/color, and the delete control in the editor to remove it. These are presentation annotations in a separate `timeTags` collection; they do not change event timestamps. Tag size and content are included in snapshots, case JSON, and full-workspace backups. Older tags retain their original 16 px size until resized. Attaching a tag to an event is intentionally deferred.

---

## 🛠️ Interactive Tool Modes

Mindweaver features 5 specialized tool modes on the top toolbar:

1. **`INSPECT` (Selection / Edit)**:
   * Click any event node on the board to open the **Full Event Dossier Modal**.
   * Click any connector line to open the **Evidence Wiring Editor**.
   * Drag empty canvas areas to pan the board.
2. **`DRAG BOARD` (Dedicated Pan)**:
   * Click and drag anywhere across the board for fast navigation across dense timelines.
3. **`PLACE EVENT` (Node Placement)**:
   * Select an icon from the quick-picker palette (Server, Warning, Skull, Lock, Shield, User, Camera, File, etc.) and click any grid coordinate cell to place a new event node.
4. **`CONNECT` (Evidence Wiring)**:
   * Click Event **A**, then click Event **B** to establish an evidence wire connection between them.
5. **`ERASE` (Deconstruction)**:
   * Click any event node or connector wire to permanently delete it (fully reversible via Undo).

---

## 🔗 Evidence Wiring & Relation Types

Connectors represent investigative causality, theoretical linkages, and verified timelines with customizable line physics:

* **Solid Line (`Documented / Verified`)**: Confirmed physical facts, forensic evidence, and verified timestamps.
* **Dashed Line (`Proposed / Theoretical`)**: Working hypotheses, suspect associations, and unverified leads.
* **Dotted Alt Line (`Chronological / Sequence`)**: Temporal flow, event cascades, and step-by-step progressions.
* **Connection Modal Editor**: Double-click any wire or use the Inspect tool to customize relation labels, switch source/target directions, or override wire colors.

---

## 📋 Comprehensive Dossier Inspector

Clicking any event node opens the detailed Case Dossier Editor:

* **Core Information**: Edit event Title, Exact Timestamp, Location, and Detailed Incident Log.
* **Subject Reference**: Link a suspect, witness, or operative tag.
* **Custom Tags**: Categorize nodes with searchable tag clusters.
* **Status Flags**: Set node status to `Pending / Unresolved`, `Verified Fact`, `Critical Lead`, or `Archived`.
* **Folder Assignment**: File the event directly into specific project case clusters.
* **Direct Connections**: Add or remove incoming/outgoing links directly within the modal.
* **Duplicate Node**: Rapidly clone complex nodes to create branching theories.

---

## ↩️ Undo / Redo & Clear Board Safety

* **Global Shortcuts**: `Ctrl+Z` / `Cmd+Z` to undo, `Ctrl+Shift+Z` / `Ctrl+Y` / `Cmd+Shift+Z` to redo.
* **Dual Location Controls**:
  * **Top Toolbar Section**: Undo and Redo with action count badges, plus Clear Board.
  * **Floating Board Section HUD**: Undo, Redo, and Clear Board buttons located directly inside the board viewport for rapid access during canvas editing.
* **Safe Board Purge**: The **CLEAR BOARD** action triggers a high-security confirmation modal displaying the count of events and connections to prevent accidental data loss.

---

## 🤖 Local AI Autofill (Ollama Incident Chronology Parser)

Extract chronological timelines automatically from raw text using local, private LLMs:

* **100% Local & Private**: Connects directly to your local Ollama instance (default: `http://localhost:11434`).
* **Multi-Model Support**: Works seamlessly with `llama3.2`, `mistral`, `gemma2`, `deepseek-r1`, `qwen2.5`, `phi3`, and custom models.
* **Automated Extraction**: Paste raw incident logs, police reports, audio transcripts, or cyber security event logs. The AI outputs structured JSON with timestamps, coordinates, icons, statuses, and evidence connections.
* **Interactive Batch Preview**: Review, filter, or deselect extracted events before placing them onto the canvas.
* **One-Click Batch Undo**: Revert any imported batch with a single click if needed.

---

## 📁 Project Folders & Multi-Case Directory

* **Multi-Case Profiles**: Switch between different case files, create new cases, or clone existing investigations.
* **Project Folders**: Group related events into colored folders (`CYBER RECON`, `FIELD OPERATIVES`, `PHYSICAL SECURITY`, `FINANCIAL TRAIL`, etc.).
* **Active Folder Filter**: Filter canvas view to focus exclusively on events within a selected folder cluster.

---

## 💾 Save States & Investigation Branching

* **Quick Snapshot Slots (Slots 1 to 10)**: Save the entire board state at critical investigation milestones.
* **Branch Pivoting**: Load any snapshot instantly to explore alternative theories or timeline forks without losing your main case file.
* **JSON Export & Import**: Export full case files to `.json` for backup, team handoff, or external archiving.

---

## 🎛️ Optics, Visual Grading & Sound Engine

* **Block Borders Bloom**: Customize glowing edge bloom (Auto-native matching theme, or custom palette overrides) and adjust bloom intensity from 0% to 100%.
* **CRT Screen Optics**: Toggle authentic scanlines and radial vignette curvature for terminal atmosphere.
* **Acoustic Feedback**: Short, softer local cues distinguish clicks, switches, board actions, and errors. Both sound buttons control one master mute: **SOUND OFF** immediately silences the hum and all action cues, and the app starts muted after reload.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| **`Alt + 1` through `Alt + 9`, `Alt + 0`** | Switch between ten independent project pages; 0 opens page 10 |
| **`F11`** | Toggle true fullscreen in the desktop app |
| **`Ctrl + Z` / `Cmd + Z`** | **Undo** last action |
| **`Ctrl + Shift + Z` / `Ctrl + Y`** | **Redo** last undone action |
| **`Keys 1 – 0`** | Quick center & zoom to starting chronological event nodes |
| **`RMB (Hold) + Drag`** | Push (Up) to **Zoom In**, Pull (Down) to **Zoom Out** |
| **`Mouse Wheel`** | **Zoom In / Out** (toggleable via HUD switch) |
| **`DISPLAY` menu** | Choose a desktop window size, maximize, or enter fullscreen |
| **`BOARD SIZE` menu** | Set 75%, 100%, 125%, or 150% board zoom; 100% keeps text sharpest |
| **`DISPLAY → Readable text`** | Use larger, clearer local system lettering (on by default); toggle off for the original terminal typography |
| **`Escape`** | Close open modals / dismiss active tool selections |

---

## 💻 Developer Commands

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

From PowerShell in the project folder:

```powershell
npm install       # install or update packages
npm run dev       # development server at localhost:3000
npm run verify    # TypeScript check plus production build
npm start         # run the completed production build
```

### Playwright regression tests

Mindweaver uses a project-local Playwright Test installation so its tests do not depend on a global Python or Node package. Install the matching Chromium build once:

```powershell
npx playwright install chromium
```

Then run:

```powershell
npm run test:e2e          # headless Chromium regression tests
npm run test:e2e:headed   # watch Chromium run the tests
npm run test:e2e:ui       # open Playwright's interactive test interface
npm run verify:full       # type-check, build, and run all browser tests
```

The baseline suite covers board launch and persistence, legend viewport bounds, theme-aware scrollbars, case JSON export, full-workspace backup and restore, and the safe offline state when Ollama is unavailable.

### Back up everything

Each page has its own board, five snapshot slots, folders, grid, visual settings, and wheel-zoom preference. Switching pages saves the current project before opening the next. The old one-board save is copied into page 1 on first launch; the old save keys are left untouched.

Open **CASES → Export Full Workspace Backup** to download one JSON file containing all ten project pages. **Restore Full Workspace Backup** replaces all ten after confirmation. Older one-page backups remain supported and restore into page 1. Back up the current workspace before restoring another backup.

The supported local runtime is Node.js with npm. The old AI Studio Gemini generator was not connected to the Mindweaver UI and has been removed. The only AI connection retained is the optional local Ollama service.

---

## 📜 License
Apache-2.0. Created for high-precision investigative timeline mapping and cyber incident analysis.
