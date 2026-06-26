<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DiaBit Project Guidelines for AI Developers

Welcome to DiaBit! This repository implements a professional directional surveying utility for the oil and gas industry.

## Technical Architecture & Conventions

### 1. Calculation Engine (`src/lib/mcm.js`)
- All directional survey coordinates must be calculated using the **Minimum Curvature Method (MCM)**.
- Calculations must support dynamic unit systems: Metric (meters, deg/30m) and Imperial (feet, deg/100ft).
- The tie-in point is the reference starting position (normally station 0: MD=0, Inc=0, Az=0).

### 2. Database Layer (`src/lib/database.js`)
- We use **SQLite3** via `better-sqlite3`.
- The database file is located at `data/diabit.db`.
- **Foreign Keys**: Always verify `PRAGMA foreign_keys = ON;` is executed on connection.
- Cascade deletes are implemented on the `nodes` table: deleting a slot or well automatically sweeps its trajectories and survey points.

### 3. Server vs. Client Code
- **Server Components & API Routes**: SQLite queries using `better-sqlite3` must only be imported in backend router code (`src/app/api/...`) or server actions. Native C/C++ SQLite wrappers will fail in front-end JS bundlers.
- **Client Components**: Any component that uses Plotly (`react-plotly.js` or `plotly.js-dist-min`) must be loaded dynamically with `ssr: false` to prevent node/window reference crashes during server builds.

## Directory Map
- `src/app/api/nodes/`: Handles hierarchy tree operations (CRUD).
- `src/app/api/surveys/`: Handles survey point updates (includes server-side recalculations).
- `src/app/api/users/`: Handles user logins and admin profiles.
- `src/components/`: Modular frontend dashboard parts (Spreadsheet, Left tree, Right settings, dynamic charts).
- `docs/tech-notes.md`: Houses the detailed mathematical equations for reference.
