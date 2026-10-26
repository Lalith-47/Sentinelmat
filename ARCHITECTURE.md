# SentinelMAT Architecture & System Design

SentinelMAT is an intelligent infrastructure monitoring and fault prediction system that bridges genuine **MATLAB numerical computing**, **Linux system programming**, **PostgreSQL database persistence**, **Node.js/Express backend engineering**, and a **React dashboard**.

---

## 1. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            Linux Monitored Host                                   |
|                                                                                   |
|   /proc, /sys, psutil (CPU %, Memory, Disk I/O, Network Throughput, Load Avg)     |
|                                     |                                             |
|                     [ collector/metrics_collector.py ]                            |
+-------------------------------------|---------------------------------------------+
                                      | HTTP POST /api/metrics (JSON)
                                      v
+-----------------------------------------------------------------------------------+
|                        Node.js / Express Backend API                              |
|                                                                                   |
|  [ Routes & Controllers ] <---> [ Alert & Incident Service ]                      |
|            |                                |                                     |
|            v                                v                                     |
|  [ PostgreSQL Database ]         [ Telegram Bot Dispatcher ]                      |
|   - hosts                         (Alert deduplication & cooldown)                |
|   - metric_samples                                                                |
|   - analysis_results                                                              |
|   - anomalies                                                                     |
|   - incidents                                                                     |
|   - alert_rules                                                                   |
|   - notification_logs                                                             |
|            |                                                                      |
|            +-----------------------+                                              |
|                                    | Invokes via MatlabRunner                     |
|                                    v                                              |
|            +-----------------------------------------------+                      |
|            |      MATLAB / Octave Numerical Engine         |                      |
|            |                                               |                      |
|            |  - analyzeMetrics.m                           |                      |
|            |  - detectAnomalies.m (Rolling Z-Scores)       |                      |
|            |  - forecastResourceUsage.m (OLS & TTE)        |                      |
|            |  - calculateStatistics.m (mu, sigma, prctile) |                      |
|            |  - evaluatePredictions.m (MAE, RMSE, R^2)     |                      |
|            +-----------------------------------------------+                      |
+-------------------------------------|---------------------------------------------+
                                      | REST API /api/...
                                      v
+-----------------------------------------------------------------------------------+
|                         React + Vite Dashboard (Frontend)                         |
|                                                                                   |
|  - Real-time Telemetry Overview Cards (CPU, Mem, Disk, Net)                       |
|  - Live Interactive SVG Telemetry Stream Chart with Rolling Mean Baseline         |
|  - MATLAB Capacity Forecasting Chart with Projected Exhaustion Date/Time          |
|  - Full MATLAB Descriptive & Percentiles Statistical Breakdown                    |
|  - Statistical Anomalies Table with Z-Scores & Explanations                       |
|  - Incident Lifecycle Management (Acknowledge, Resolve, Notes)                    |
|  - Alert Rules Editor & Telegram Dispatch Controls                                |
|  - Controlled Fault Simulation Studio (Safe CPU, Mem, Disk stress sandbox)        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Responsibilities

### 2.1 Python Metrics Collector (`collector/`)
- Samples real system metrics directly from the host operating system using `psutil`.
- Performs client-side schema validation (ranges, positive byte counts).
- Performs host auto-registration (`POST /api/hosts/register`).
- Periodic transmission loop with exponential backoff on network failures.

### 2.2 MATLAB Numerical Suite (`matlab/`)
- Pure `.m` codebase implementing core statistical and analytical routines.
- Never substituted with simplified mock data or approximations.
- Ingests structured time-series datasets, filters invalid points, and computes:
  - Distribution metrics (Mean, Median, Std Dev, Variance, IQR, P25-P99, Moving Averages).
  - Rolling baseline standardized deviation scoring ($Z$-scores) with zero-variance protection.
  - Ordinary Least Squares regression forecasting capacity exhaustion (TTE).
  - Out-of-sample holdout validation ($80/20$ partition) computing MAE, RMSE, MAPE, and directional accuracy.

### 2.3 Node.js / Express Backend (`backend/`)
- Ingestion pipeline with parameterized SQL transactions.
- `MatlabRunner`: Execution layer supporting Docker Octave, local Octave, and native MATLAB CLI.
- `AlertService`: Rule evaluation with deduplication and cooldown to prevent alert storms.
- `IncidentService`: State transition management (Open $\to$ Acknowledged $\to$ Resolved).
- `TelegramService`: Formats HTML alert notifications with emojis and host links.

### 2.4 PostgreSQL Persistence (`database/`)
- Relational schema enforcing foreign keys and cascade rules.
- Timestamp indexes on `(host_id, timestamp DESC)` for fast window queries.
- Raw metric samples kept separate from computed analytical results.

### 2.5 React Dashboard (`frontend/`)
- Custom CSS design system with dark monitoring aesthetics.
- High-contrast color indicators: Green (Healthy), Amber (Warning), Red (Critical).
- Interactive SVG visualizations for telemetry and regression forecasting.
- Fault simulation triggers for end-to-end demonstrations.
