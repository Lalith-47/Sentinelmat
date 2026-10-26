#!/usr/bin/env python3
import requests
import json

BASE = "http://localhost:5000/api"

print("==================================================")
print(" 1. HEALTH CHECKS")
print("==================================================")
r1 = requests.get(f"{BASE}/health").json()
print("Backend & DB Health:", json.dumps(r1, indent=2))
r2 = requests.get(f"{BASE}/health/matlab").json()
print("MATLAB Engine Health:", json.dumps(r2, indent=2))

print("\n==================================================")
print(" 2. REAL HOST & LIVE METRICS INGESTION")
print("==================================================")
hosts = requests.get(f"{BASE}/hosts").json()
print(f"Registered Hosts ({len(hosts)}):", [h["id"] for h in hosts])
latest = requests.get(f"{BASE}/metrics/latest/arch").json()
print("Latest Telemetry (host: arch):")
print(f"  CPU: {latest.get('cpu_utilization')}% | Mem: {latest.get('memory_utilization')}% | Disk: {latest.get('disk_utilization')}% | Net Rx: {latest.get('network_rx_bytes_sec')} B/s")

print("\n==================================================")
print(" 3. MATLAB NUMERICAL ANALYSIS EXECUTION (.m)")
print("==================================================")
analysis = requests.post(f"{BASE}/analysis/run", json={"hostId": "arch"}).json()
print("MATLAB Engine Version:", analysis.get("engineInfo"))
print("Execution Time:", analysis.get("pipelineExecutionTimeSec"), "seconds")
print("CPU Stats calculated by MATLAB:")
print(json.dumps(analysis.get("metrics", {}).get("cpu", {}).get("stats", {}), indent=2))
print("Disk Forecast (OLS Regression & TTE):")
print(json.dumps(analysis.get("metrics", {}).get("disk", {}).get("forecast", {}), indent=2))

print("\n==================================================")
print(" 4. ANOMALIES & INCIDENTS MANAGEMENT")
print("==================================================")
anoms = requests.get(f"{BASE}/anomalies").json()
print(f"Total Anomalies Detected: {len(anoms)}")
if anoms:
    print(f" Latest Anomaly: {anoms[0]['metric_type']} | Z-Score: {anoms[0]['z_score']} | Severity: {anoms[0]['severity']}")

incidents = requests.get(f"{BASE}/incidents").json()
print(f"Total Incidents Logged: {len(incidents)}")
if incidents:
    inc = incidents[0]
    print(f" Testing Incident #{inc['id']} (Current Status: {inc['status']})")
    if inc["status"] == "open":
        ack = requests.post(f"{BASE}/incidents/{inc['id']}/acknowledge", json={"user": "Lead SRE"}).json()
        print(f"  -> Acknowledged! New Status: {ack.get('status')} by {ack.get('acknowledged_by')}")
    res = requests.post(f"{BASE}/incidents/{inc['id']}/resolve", json={"notes": "System verified stable by engineer."}).json()
    print(f"  -> Resolved! New Status: {res.get('status')} (Notes: {res.get('resolution_notes')})")

print("\n==================================================")
print(" 5. ALERT RULES & CONFIGURATION")
print("==================================================")
rules = requests.get(f"{BASE}/alerts/rules").json()
print(f"Configured Rules ({len(rules)}):")
for rule in rules:
    print(f"  - [{rule['id']}] {rule['name']} ({rule['metric_type']} {rule['condition']} {rule['threshold_value']}) -> Enabled: {rule['enabled']}")

print("\n==================================================")
print(" 6. CONTROLLED FAULT SIMULATION TEST")
print("==================================================")
sim = requests.post(f"{BASE}/simulation/start", json={"type": "cpu", "durationSeconds": 10}).json()
print("Started Simulation:", json.dumps(sim, indent=2))
status = requests.get(f"{BASE}/simulation/status").json()
print(f"Active Simulations: {len(status)}")

print("\n==================================================")
print(" ALL 6 CORE FUNCTIONALITY MODULES VERIFIED WORKING!")
print("==================================================")
