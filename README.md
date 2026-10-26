# SentinelMAT: Intelligent Infrastructure Monitoring & Fault Prediction System

SentinelMAT is an end-to-end, enterprise-grade infrastructure monitoring and fault prediction platform that bridges **MATLAB-based numerical computing**, **Linux system programming**, **Node.js/Express backend engineering**, **PostgreSQL database persistence**, and an interactive **React monitoring dashboard**.

The central architectural tenet of SentinelMAT is that **MATLAB executes genuine numerical analysis algorithms**—implementing descriptive statistics, adaptive rolling-baseline statistical anomaly detection, Ordinary Least Squares (OLS) capacity trend modeling, and Time-To-Exhaustion (TTE) prediction over real Linux system telemetry.

---

## 1. Key Capabilities

1. **Linux Telemetry Stream:** Collects real CPU (utilization, per-core, load averages 1m/5m/15m), Memory (used, free, available, percentage), Disk (mount point capacity, byte rates), and Network throughput (Rx/Tx bytes/sec) via Python `psutil`.
2. **Authentic MATLAB Numerical Engine:** Pure `.m` suite executing mathematical routines for:
   - Descriptive statistics & tail percentiles ($P_{25}, P_{50}, P_{75}, P_{90}, P_{95}, P_{99}$, IQR).
   - Adaptive rolling-window baseline mean ($\mu_W$) and standard deviation ($\sigma_W$).
   - Standardized deviation scoring ($Z$-score) with zero-variance protection.
   - Ordinary Least Squares regression ($y = \hat{\beta}_0 + \hat{\beta}_1 t$) modeling resource growth rates ($\hat{\beta}_1$).
   - Time-To-Exhaustion (TTE) calculation indicating projected hours until critical disk saturation ($90\%$/$95\%$).
   - Out-of-sample holdout validation ($80/20$ partition) computing MAE, RMSE, MAPE, and directional accuracy.
3. **Database-Backed State & Storage:** PostgreSQL relational schema preserving raw telemetry samples separate from analytical outputs, active anomalies, incident triage state, alert rules, and notification audits.
4. **Interactive Dark Dashboard:** Responsive React + Vite interface with real-time gauges, live SVG telemetry charts with rolling baseline envelopes, capacity projection charts, and incident management actions.
5. **Incident Lifecycle & Telegram Alerts:** Automated incident triage (Open $\to$ Acknowledged $\to$ Resolved) with deduplication and cooldown to prevent alert storms; optional Telegram Bot integration.
6. **Controlled Fault Simulation Studio:** Non-destructive CPU stress, bounded memory allocation, and gradual disk file growth sandboxes with automatic watchdog timers and cleanup handlers.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Numerical Analysis** | **MATLAB / GNU Octave** | Core mathematical algorithms (`.m` functions) for statistics, anomaly detection, and regression forecasting. |
| **Metric Collection** | **Python 3 (`psutil`, `requests`)** | Collects real operating system metrics from Linux `/proc` and `/sys`. |
| **Backend REST API** | **Node.js + TypeScript + Express** | Ingestion pipeline, database transactions, MATLAB execution runner, and alert management. |
| **Persistence** | **PostgreSQL 16** | Relational storage for hosts, samples, analysis results, anomalies, and incidents. |
| **Frontend Dashboard** | **React 18 + TypeScript + Vite** | Professional dark monitoring dashboard with interactive SVG charts and triage controls. |
| **Containerization** | **Docker & Docker Compose** | Containerized service orchestration for deployment across environments. |

---

## 3. Project Directory Structure

```
sentinelmat/
├── matlab/                          # Core MATLAB Numerical Engine (.m code)
│   ├── calculateStatistics.m        # Descriptive stats, percentiles, moving averages
│   ├── detectAnomalies.m            # Rolling baseline standardized Z-score detector
│   ├── forecastResourceUsage.m      # OLS regression & Time-To-Exhaustion (TTE)
│   ├── evaluatePredictions.m        # Train/test holdout validation (MAE, RMSE, MAPE)
│   ├── analyzeMetrics.m             # Multi-metric analysis orchestrator
│   ├── runAnalysisPipeline.m        # CLI runner supporting batch execution
│   └── tests/                       # MATLAB unit & integration test suite
│       ├── test_calculateStatistics.m
│       ├── test_detectAnomalies.m
│       ├── test_forecastResourceUsage.m
│       ├── test_evaluatePredictions.m
│       └── run_all_tests.m
├── collector/                       # Python Linux Metrics Collector
│   ├── metrics_collector.py         # Real psutil telemetry collector
│   ├── requirements.txt             # Collector dependencies
│   └── tests/                       # Pytest test suite
│       └── test_collector.py
├── backend/                         # Node.js + TypeScript REST API
│   ├── src/
│   │   ├── config/                  # Environment configuration
│   │   ├── db/                      # PostgreSQL connection pool & health checks
│   │   ├── matlab/MatlabRunner.ts   # Real MATLAB/.m execution runner
│   │   ├── repositories/            # Database repositories (SQL transactions)
│   │   ├── services/                # Analysis, Alert, Incident, & Telegram services
│   │   ├── controllers/             # REST endpoint controllers
│   │   ├── routes/api.ts            # API routes definitions
│   │   └── server.ts                # App bootstrap & periodic scheduler
│   ├── package.json
│   └── tsconfig.json
├── frontend/                        # React + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/              # Telemetry, Forecast, Anomaly, & Incident views
│   │   ├── services/api.ts          # Backend API client
│   │   ├── App.tsx                  # Main application component
│   │   └── index.css                # Custom dark monitoring design system
│   ├── package.json
│   └── vite.config.ts
├── database/                        # PostgreSQL Migrations & Seeds
│   ├── migrations/001_initial_schema.sql
│   └── seeds/seed_data.sql
├── simulations/                     # Controlled Fault Simulation Suite
│   ├── stress_cpu.py                # Safe CPU load across cores
│   ├── pressure_memory.py           # Bounded physical memory allocation
│   ├── fill_disk.py                 # Gradual scratch volume disk growth
│   └── simulate_scenarios.py        # End-to-end integration test scenario
├── docker-compose.yml               # Complete container orchestration
├── .env.example                     # Environment configuration template
├── MATHEMATICAL_METHODS.md          # In-depth mathematical formulations
├── ARCHITECTURE.md                  # System architecture & data flow
└── TROUBLESHOOTING.md               # Operational troubleshooting guide
```

---

## 4. Quickstart Guide

### 4.1 Prerequisites
- **Linux Environment** (e.g. Arch Linux, Ubuntu, Debian, or RHEL)
- **Node.js** (v18+) & **npm**
- **Python** (3.8+) with `psutil` and `requests`
- **PostgreSQL** (v14+) running locally or via Docker
- **Docker** (with access to run `gnuoctave/octave` or a local MATLAB installation)

### 4.2 Database Initialization
```bash
# Create database
psql -U postgres -h localhost -c "CREATE DATABASE sentinelmat;"

# Apply schema migrations and default alert rules
psql -U postgres -h localhost -d sentinelmat -f database/migrations/001_initial_schema.sql
psql -U postgres -h localhost -d sentinelmat -f database/seeds/seed_data.sql
```

### 4.3 Running MATLAB Unit Tests
Verify the mathematical algorithms directly on the numerical engine:
```bash
docker run --rm -v "$(pwd)/matlab:/workspace/matlab" -w /workspace/matlab/tests gnuoctave/octave:latest \
  octave --no-gui --quiet run_all_tests.m
```
Expected output:
```
========================================
 SentinelMAT Mathematical Test Suite    
========================================
Running test_calculateStatistics...
PASS: test_calculateStatistics
Running test_detectAnomalies...
PASS: test_detectAnomalies
Running test_forecastResourceUsage...
PASS: test_forecastResourceUsage
Running test_evaluatePredictions...
PASS: test_evaluatePredictions
========================================
 ALL MATLAB TESTS PASSED SUCCESSFULLY! 
========================================
```

### 4.4 Start the Backend API
```bash
cd backend
npm install
npm test            # Runs smoke test verifying DB & MATLAB runner
npm run dev         # Starts REST API on http://localhost:5000
```

### 4.5 Start the Real Linux Metrics Collector
In a separate terminal:
```bash
cd collector
# Test single-shot collection:
python3 metrics_collector.py --once

# Start continuous collection loop (5s interval):
python3 metrics_collector.py
```

### 4.6 Start the Frontend Dashboard
In a third terminal:
```bash
cd frontend
npm install
npm run dev         # Launches Vite dev server on http://localhost:5173
```
Open **http://localhost:5173** in your browser to view the live dashboard.

---

## 5. Verification & Demonstration Walkthrough

SentinelMAT includes an automated end-to-end scenario runner that validates the entire data pipeline without manual clicking:

```bash
python3 simulations/simulate_scenarios.py
```

This script performs:
1. Registers a dedicated test host (`sentinel-scenario-host`).
2. Transmits 25 historical baseline telemetry samples with an anomalous CPU spike ($95.5\%$) and a steady linear disk growth trend ($60\% \to 79.2\%$).
3. Invokes the genuine MATLAB analysis pipeline via the backend API.
4. Asserts that MATLAB detected the CPU anomaly ($Z\text{-score} > 3.0$).
5. Asserts that MATLAB fitted the OLS regression model, recognized predictable growth ($R^2 > 0.99$), and calculated the Time-To-Exhaustion (TTE).
6. Verifies that all anomalies and forecast parameters were successfully persisted in PostgreSQL.

---

## 6. Mathematical Methods Summary

- **Adaptive Rolling Baseline:** Computes running $\mu_W$ and $\sigma_W$ over a preceding window $W_t$ of size $w=30$.
- **Standardized Score ($Z$-Score):**
  $$Z_t = \frac{x_t - \mu_W}{\max(\sigma_W, 10^{-4})}$$
  Anomalies trigger when $|Z_t| \ge 2.5$ (Warning) or $|Z_t| \ge 3.5$ (Critical).
- **OLS Trend Forecasting:**
  $$\hat{\beta}_1 = \frac{\sum (t_i - \bar{t})(y_i - \bar{y})}{\sum (t_i - \bar{t})^2}, \quad \hat{\beta}_0 = \bar{y} - \hat{\beta}_1 \bar{t}$$
- **Time-To-Exhaustion (TTE):**
  $$\Delta t_{\text{TTE}} = \frac{Y_{\text{crit}} - y_{\text{now}}}{\hat{\beta}_1} \quad (\text{for } \hat{\beta}_1 > 0)$$

For exhaustive derivations, see [MATHEMATICAL_METHODS.md](file:///home/lalith/Projects/final%20project%20matlab/MATHEMATICAL_METHODS.md).

---

## 7. License

Licensed under the MIT License.
