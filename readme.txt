========================================================================
           S E P U L C H R A L   L A B S   //   N X - D A R K   L A B S
            INSTRUMENT COGNITIVE SHAPER & TERMINAL DESKTOP SHELL
========================================================================

Sepulchral Labs // NX-Dark Labs is a local workshop and high-fidelity 
futuristic layout designer, shaper, and terminal interface simulator.
Specially engineered for Windows and Linux targets, it brings high-contrast
monochrome vector graphics, real-time matrix alignments, 7x9 glyph 
anatomy analyses, and automated tactile design environments to life.

------------------------------------------------------------------------
1. SYSTEM GEOMETRIES & CHARACTERISTIC PRESETS (THEMES)
------------------------------------------------------------------------

* NightFly (Classic Active Emerald/Cyan Green Vector)
  - Primary color: #05ffa1
  - Vibe: Space telemetry shaper, active neural vectors.

* The M.I.R.E. (Forgotten Amber/Golden Dust)
  - Primary color: #ffb000
  - Vibe: Industrial golden fallout, archival node terminal.

* Nephila Systems (External Cyan Intelligence)
  - Primary color: #00f0ff
  - Vibe: Modern high-performance cybernetic network matrices.

* The Sepulchre (Rejected Loss / Stealth Monochrome)
  - Primary color: #ffffff
  - Vibe: Silent stealth gray-scale telemetry, mechanical purity.

* Sepulchral{NX} (Machine Code Drift Red)
  - Primary color: #ef4444
  - Vibe: Faulty reactor, high-alert drift signal grids.

------------------------------------------------------------------------
2. GRAPHIC ANATOMY RULES
------------------------------------------------------------------------

* Unified Matrix Grid: 
  A 7x9 modular grid alignment where all custom vector glyphs conform.
* Geometric Angles:
  All stroke diagonals cut strictly at 22.5 degrees.
* Squared Curves:
  Arcs are rendered as squared corners rather than perfect circular sweeps.
* Imperfect Forms:
  Every closed shape includes a subtle, intentional 1px gap or offset 
  to mimic raw mechanical plotting calibration errors.

------------------------------------------------------------------------
3. MODULAR HIGH-FIDELITY WIDGETS
------------------------------------------------------------------------

* RABBIT_HOLE_RECORDER:
  An active system terminal tracking cognitive threads, sessions, 
  branches, and current file system anomalies.
* GLYPH_ANATOMY_ANALYZER:
  Interactive 7x9 vector outline matrix for precision-testing letterform 
  structures.
* COGNITIVE_RESONATOR:
  Simulates a real-time responsive audio signal resonance spectra loop.
* NEURAL_DRIFT_FLOW:
  A continuous sine-wave telemetry graph reporting real-time drift levels.

------------------------------------------------------------------------
4. WINDOWS LOCAL INSTALLATION GUIDE
------------------------------------------------------------------------

To clone, set up, and run the Sepulchral{NX} terminal shaper locally on 
a Windows workstation (Windows 10 / Windows 11):

### STEP A: PREREQUISITES
1. Install Node.js:
   Download and install the LTS (Long-Term Support) version from:
   https://nodejs.org/
   (This includes "npm" which is required to install dependencies).

2. Install Git (Optional, for GitHub pushing):
   Download and install Git for Windows from:
   https://git-scm.com/

### STEP B: LOCAL PREPARATION
1. Download or clone the source files:
   If using Git:
     git clone <YOUR_GITHUB_REPO_URL>
     cd <REPO_NAME>
   If you downloaded a ZIP:
     Extract the ZIP archive, open Command Prompt (cmd) or PowerShell, 
     and change directory into the root:
     cd C:\path\to\extracted\folder

### STEP C: PACKAGE INSTALLATION
1. Run the following command in Command Prompt, PowerShell, or Git Bash:
     npm install
   (This will download and unpack all packages listed in package.json, 
   creating the local "node_modules" folder).

### STEP D: RUNNING IN DEVELOPMENT MODE
1. Launch the Vite dev server by running:
     npm run dev
2. In your web browser, open the URL displayed in the console:
     http://localhost:3000
   (All hot changes to code files will instantly update in the browser).

### STEP E: COMPILING FOR PRODUCTION
1. To compile a lightweight, optimized bundle of static HTML, CSS, and 
   JS files, run:
     npm run build
2. The production files will be output into the "dist/" folder. You can 
   deploy these files to GitHub Pages, Netlify, Vercel, or host them locally 
   using any static server engine (e.g., IIS, Nginx, or apache on Windows).
   To test the production build locally:
     npm run preview

------------------------------------------------------------------------
5. GITHUB DEPLOYMENT (HOW TO PUSH TO GITHUB)
------------------------------------------------------------------------

Follow these commands to push the project files to your own GitHub repository:

1. Open Git Bash or terminal in the project root.
2. Initialize Git (if not already done):
     git init
3. Add all project files (except those excluded by .gitignore):
     git add .
4. Commit the initial workspace state:
     git commit -m "feat: initialize Sepulchral Labs terminal shaper workspace"
5. Create a new empty repository on GitHub (https://github.com/new).
6. Link the local repository to your remote GitHub repository:
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
7. Rename the active branch to "main":
     git branch -M main
8. Push the local commits to GitHub:
     git push -u origin main

------------------------------------------------------------------------
6. ACOUSTIC EMISSION ENGINE
------------------------------------------------------------------------
To comply with standard modern browser safety policies, all audio nodes 
initialize in a silent state on launch.
- To enable the signature mechanical switches, clicks, and low-frequency 
  power reactor hum, click the "ACOUSTIC MUTED" status banner in the top 
  header bar, or flip the "Acoustic Coupling" toggle inside the controls tab.

========================================================================
             [ SEPULCHRAL LABS // DESIGN BLUEPRINT ARCHIVED ]
========================================================================

------------------------------------------------------------------------
7. SECURE AI SYNTHESIS & API ENDPOINTS
------------------------------------------------------------------------

Sepulchral Labs features an AI-Powered Module Synthesizer that generates 
custom futuristic grid-aligned widgets from natural language prompts:

* API Endpoint: 
  `POST /api/generate-module`
  This route takes a module idea and translates it into modular grid-aligned 
  JSON specifications (e.g. name, type, grid coordinates, dimensions, glow 
  colors, and visual icons).

* Secure Environment Configuration:
  - All AI requests are proxied securely on the server.
  - The Gemini API Key is stored exclusively as `GEMINI_API_KEY` on the 
    backend environment and is NEVER sent or exposed to the client browser.
  - To configure locally, copy `.env.example` to a new file named `.env` and 
    define your API key there:
      GEMINI_API_KEY=your_actual_api_key_here

* Zero-Dependency Local Fallback Engine:
  - If the `GEMINI_API_KEY` environment variable is not defined or is 
    otherwise unavailable, the system automatically engages an advanced 
    local heuristic synthesizer fallback.
  - This ensures 100% offline availability and full functionality even 
    without remote API connections, preserving the user experience in all environments.

