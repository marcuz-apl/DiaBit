# DiaBit: Directional Drilling Survey Calculation Suite

**DiaBit** is a premium, engineering-grade web application for calculating and visualizing directional drilling trajectories in the Oil & Gas industry. Designed to mimic standard systems such as Landmark COMPASS/EDT and Paradigm SysDril, it utilizes the mathematically rigorous **Minimum Curvature Method (MCM)** to calculate 3D survey coordinates from Measured Depth (MD), Inclination (Inc), and Azimuth (Az) logs.

---

## Key Features

1. **Precision MCM Calculations**: Instant, automatic calculations of TVD, Northing, Easting, Dogleg Severity (DLS), Vertical Section (VS), and Closure.
2. **Advanced Geo-Magnetic Modeling**: Seamless fetching of magnetic declination, dip, and total field via NOAA HDGM API, with a robust offline fallback using the full `geomagnetism` WMM2025 dataset (n=12).
3. **Dynamic Project Registry**: Tree-style navigation hierarchy organizing data from Country down to States, Basins, Fields, Wells, Slots, Trajectory Plans, and Deviation Surveys.
4. **Interactive Excel Grid**: High-performance spreadsheet interface supporting inline edits, row insertions/appenditions/deletions, and automatic recalculations.
5. **Planned vs. Real-Time Overlay Charts**: Dynamic 3D Trajectory, 2D Plan, and Vertical Section plots rendering planned trajectories alongside actual deviation surveys.
6. **CSV Integration**: Seamless import and export of survey stations in CSV spreadsheets.
7. **Admin Panel**: Complete user account administration, database node management, and CRS / Datum Shift registries.
8. **Sleek Light/Dark Themes**: Glassmorphism dashboard layout with auto-hiding navigation tree when idle (30 seconds).

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
   *This creates the database directory `./data/`, builds the schema, and seeds default profiles and sample Texas Permian Basin / Canadian well registries.*

3. **Start the Local Development Server**:
   ```bash
   npm run dev
   ```
   *Navigate to `http://localhost:3030` to interact with the application.*

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
The application will run on port `3030` (`http://localhost:3030`). Database data is persisted inside the container's `./data/` folder mapped to host storage.

### Docker Hub & Synology NAS Deployment
DiaBit is perfectly suited for self-hosted NAS environments. To deploy your own custom image to a Synology NAS:

1. **Build & Push to Docker Hub:**
   ```bash
   docker login
   docker build -t <your-dockerhub-username>/diabit:latest .
   docker push <your-dockerhub-username>/diabit:latest
   ```

2. **Synology Container Manager Setup:**
   - **Image**: Search the registry for `<your-dockerhub-username>/diabit` and download the `latest` tag.
   - **Port Settings**: Map the container port `3030` to an available local port (e.g., Local `3030` ➔ Container `3030`).
   - **Volume Settings (Crucial)**: To ensure you do not lose your database on restart, create a folder in your Synology File Station (e.g., `docker/diabit/data`). Map it as follows:
     - **File/Folder**: `docker/diabit/data`
     - **Mount path**: `/app/data`

*Note: Since the native database dependencies (like `better-sqlite3`) compile during the docker build phase, the resulting image is entirely self-contained and ready for deployment.*
