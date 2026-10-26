#!/usr/bin/env python3
"""
SentinelMAT End-to-End Fault Scenario Verification Suite
Runs end-to-end integration tests:
  1. Ingests baseline metrics
  2. Injects controlled stress spikes
  3. Invokes real MATLAB numerical analysis pipeline
  4. Verifies statistical anomalies and OLS capacity forecasts in database
"""

import sys
import time
import requests
import json

BACKEND_URL = "http://localhost:5000"
TEST_HOST_ID = "sentinel-scenario-host"

def log(msg):
    print(f"[ScenarioRunner] {msg}")

def check_backend_alive():
    try:
        r = requests.get(f"{BACKEND_URL}/api/health", timeout=3)
        return r.status_code == 200
    except Exception:
        return False

def register_test_host():
    payload = {
        "id": TEST_HOST_ID,
        "hostname": "sentinel-scenario-testbox",
        "ip_address": "10.0.0.42",
        "os_info": "Linux 6.10 Test Kernel",
        "cpu_count": 4,
        "total_memory_bytes": 16 * 1024 * 1024 * 1024,
        "total_disk_bytes": 500 * 1024 * 1024 * 1024
    }
    r = requests.post(f"{BACKEND_URL}/api/hosts/register", json=payload, timeout=5)
    assert r.status_code in (200, 201), f"Host registration failed: {r.text}"
    log("Test host registered successfully.")

def inject_metric_series():
    log("Injecting 25 historical baseline samples with CPU spike and steady disk growth...")
    base_time = int(time.time()) - (25 * 10) # 10s intervals

    for i in range(25):
        t_stamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(base_time + i * 10))
        # Normal CPU: ~20%, Spike at index 22: 95.5%
        cpu_val = 95.5 if i == 22 else round(20.0 + (i % 3) * 1.5, 2)
        # Disk steadily growing from 60% upwards
        disk_val = round(60.0 + (i * 0.8), 2)
        mem_val = round(50.0 + (i % 4) * 1.0, 2)

        sample = {
            "host_id": TEST_HOST_ID,
            "timestamp": t_stamp,
            "cpu_utilization": cpu_val,
            "cpu_load_1m": 0.8 if i != 22 else 4.2,
            "cpu_load_5m": 0.7,
            "cpu_load_15m": 0.6,
            "memory_utilization": mem_val,
            "memory_used_bytes": int(mem_val * 160000000),
            "memory_total_bytes": 16000000000,
            "disk_utilization": disk_val,
            "disk_used_bytes": int(disk_val * 5000000000),
            "disk_total_bytes": 500000000000,
            "network_rx_bytes_sec": 12000.0,
            "network_tx_bytes_sec": 8000.0,
            "availability": True
        }
        r = requests.post(f"{BACKEND_URL}/api/metrics", json=sample, timeout=3)
        assert r.status_code in (200, 201), f"Sample ingestion failed: {r.text}"

    log("25 metric samples injected.")

def trigger_matlab_and_verify():
    log("Invoking MATLAB numerical analysis pipeline via Backend API...")
    r = requests.post(f"{BACKEND_URL}/api/analysis/run", json={"hostId": TEST_HOST_ID}, timeout=45)
    assert r.status_code == 200, f"MATLAB analysis API failed: {r.text}"
    result = r.json()

    log(f"MATLAB Pipeline completed! Engine: {result.get('engineInfo')}")
    log(f"Pipeline Execution Time: {result.get('pipelineExecutionTimeSec')}s")

    # Verify CPU anomaly detection
    cpu_anoms = result["metrics"]["cpu"]["anomalies"]
    log(f"CPU Anomalies detected: {cpu_anoms['anomalyCount']}")
    assert cpu_anoms["anomalyCount"] >= 1, "Expected at least 1 CPU anomaly detected by MATLAB!"

    # Verify Disk forecasting
    disk_fc = result["metrics"]["disk"]["forecast"]
    log(f"Disk Forecast predictable: {disk_fc['isPredictable']} | Slope: {disk_fc['slope']:.6f} | R^2: {disk_fc['rSquared']:.3f}")
    assert disk_fc["isPredictable"] is True, "Expected disk growth to be recognized as predictable by MATLAB!"
    log(f"Projected Time-To-Exhaustion: {disk_fc['timeToExhaustionHours']:.2f} hours")

    # Verify in database
    anom_resp = requests.get(f"{BACKEND_URL}/api/anomalies?hostId={TEST_HOST_ID}", timeout=5)
    anoms_in_db = anom_resp.json()
    assert len(anoms_in_db) >= 1, "Expected anomalies persisted in PostgreSQL database!"
    log(f"Verified {len(anoms_in_db)} anomaly records in PostgreSQL.")

    incidents_resp = requests.get(f"{BACKEND_URL}/api/incidents", timeout=5)
    incidents = incidents_resp.json()
    log(f"Active incidents count: {len(incidents)}")

    log("========================================================")
    log(" SUCCESS: END-TO-END FAULT SCENARIO TEST VERIFIED!     ")
    log(" Real metrics -> Postgres -> MATLAB Engine -> Results! ")
    log("========================================================")

if __name__ == "__main__":
    if not check_backend_alive():
        print(f"Error: SentinelMAT Backend is not accessible at {BACKEND_URL}. Start the backend first.")
        sys.exit(1)

    register_test_host()
    inject_metric_series()
    trigger_matlab_and_verify()
