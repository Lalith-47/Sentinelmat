# SentinelMAT Troubleshooting & Integration Guide

This guide provides operational solutions for configuring, debugging, and maintaining the SentinelMAT system.

---

## 1. MATLAB & Numerical Engine Troubleshooting

SentinelMAT supports three execution modes configured via `MATLAB_EXEC_MODE` in `.env`:
1. `docker_octave` (Default): Uses containerized GNU Octave. No local MATLAB license needed on developer workstations.
2. `octave`: Uses a local installation of GNU Octave in your system `$PATH`.
3. `matlab`: Uses an officially installed MathWorks MATLAB installation via the `matlab` CLI batch mode.

### 1.1 "docker: permission denied while trying to connect to the Docker daemon socket"
- **Cause:** Current user is not in the `docker` group.
- **Fix:**
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```

### 1.2 "MATLAB engine did not produce output file"
- **Diagnostic:** Test the MATLAB runner manually:
  ```bash
  docker run --rm -v "$(pwd)/matlab:/workspace/matlab" gnuoctave/octave:latest \
    octave --no-gui --quiet /workspace/matlab/tests/run_all_tests.m
  ```
- **File Permissions:** Verify that the temporary directory (`/tmp/sentinelmat_runner`) is writable by the backend user.

### 1.3 Running with Official MathWorks MATLAB
If you have a licensed MATLAB installation on your host:
1. Ensure the `matlab` binary is in your `$PATH`:
   ```bash
   which matlab
   ```
2. Update your `.env`:
   ```ini
   MATLAB_EXEC_MODE=matlab
   MATLAB_CODE_DIR=/absolute/path/to/sentinelmat/matlab
   ```
3. The backend will invoke:
   ```bash
   matlab -batch "addpath('...'); runAnalysisPipeline('input.json', 'output.json')"
   ```

---

## 2. PostgreSQL Database Connection

### 2.1 Connection Refused on Port 5432
- **Check Status:**
  ```bash
  psql -U postgres -h localhost -p 5432 -c "SELECT 1"
  ```
- **If running Docker Compose:** Ensure PostgreSQL container is healthy:
  ```bash
  docker ps | grep postgres
  docker logs sentinelmat_postgres
  ```

### 2.2 Running Migrations Manually
```bash
psql -U postgres -h localhost -d sentinelmat -f database/migrations/001_initial_schema.sql
psql -U postgres -h localhost -d sentinelmat -f database/seeds/seed_data.sql
```

---

## 3. Metrics Collector Issues

### 3.1 Permission Errors Reading System Metrics
- `psutil` reads from `/proc` and `/sys`. Under standard Linux user permissions, all CPU, Memory, Disk, and Network metrics are readable without root privileges.
- If running inside a container, mount host directories:
  ```yaml
  volumes:
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
  environment:
    - PROCFS_PATH=/host/proc
  ```

### 3.2 Backend Connection Refused in Collector
- If the backend is not yet started, the collector will automatically retry with exponential backoff.
- Verify backend is alive:
  ```bash
  curl http://localhost:5000/api/health
  ```

---

## 4. Telegram Notification Dispatch

### 4.1 Alerts are Not Reaching Telegram
1. Create a bot using [@BotFather](https://t.me/BotFather) and retrieve your API token.
2. Retrieve your Telegram numeric Chat ID (using [@userinfobot](https://t.me/userinfobot)).
3. Configure `.env`:
   ```ini
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRstuvwxYZ
   TELEGRAM_CHAT_ID=987654321
   ```
4. Verify notification logs in the database:
   ```sql
   SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;
   ```
   If unconfigured, notifications are safely recorded with status `skipped`.
