# DiaBit: Directional Drilling Survey Calculation Suite

**DiaBit** is a premium, engineering-grade web application for calculating and visualizing directional drilling trajectories in the Oil & Gas industry. Designed to mimic standard systems such as Landmark COMPASS/EDT and Paradigm SysDril, it utilizes the mathematically rigorous **Minimum Curvature Method (MCM)** to calculate 3D survey coordinates from Measured Depth (MD), Inclination (Inc), and Azimuth (Az) logs.

---

## Key Features

1. **Precision MCM Calculations**: Instant, automatic calculations of TVD, Northing, Easting, Dogleg Severity (DLS), Vertical Section (VS), and Closure.
2. **Dynamic Project Registry**: Tree-style navigation hierarchy organizing data from Country down to States, Basins, Fields, Wells, Slots, Trajectory Plans, and Deviation Surveys.
3. **Interactive Excel Grid**: High-performance spreadsheet interface supporting inline edits, row insertions/appenditions/deletions, and automatic recalculations.
4. **Planned vs. Real-Time Overlay Charts**: Dynamic 3D Trajectory, 2D Plan, and Vertical Section plots rendering planned trajectories alongside actual deviation surveys.
5. **CSV Integration**: Seamless import and export of survey stations in CSV spreadsheets.
6. **Admin Panel**: Complete user account administration and database node management.
7. **Sleek Light/Dark Themes**: Glassmorphism dashboard layout with auto-hiding navigation tree when idle (30 seconds).

---

## Tech Stack

- **Frontend Framework**: Next.js 14/15 (App Router), React 18/19
- **Styles & Layout**: Tailwind CSS v4, Lucide React Icons
- **Calculations Engine**: Pure JavaScript Minimum Curvature Math (`src/lib/mcm.js`)
- **Data Visualization**: Dynamic Plotly.js (`react-plotly.js` + `plotly.js-dist-min`)
- **Database**: SQLite3 via native Node client `better-sqlite3` (stored in `./data/diabit.db`)
- **Containerization**: Docker & docker-compose

---

## Local Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize and Seed the Database**:
   ```bash
   node src/lib/run-db-init.mjs
   ```
   *This creates the database directory `./data/`, builds the schema, and seeds default profiles and a sample Texas Permian Basin well registry.*

3. **Start the Local Development Server**:
   ```bash
   npm run dev
   ```
   *Navigate to `http://localhost:3000` to interact with the application.*

4. **Default Test Accounts**:
   - **Administrator**: Username: `admin` | Password: `adminpassword` (or `admin123` depending on seeding)
   - **Engineer**: Username: `engineer` | Password: `driller123`

---

## Containerized Deployment (Docker)

To launch DiaBit in isolated containers:

### Build and Run with Docker Compose
```bash
docker-compose up --build -d
```
The application will run on port `3000` (`http://localhost:3000`). Database data is persisted inside the container's `./data/` folder mapped to host storage.
