#!/usr/bin/env python3
"""
SentinelMAT - Linux Infrastructure Metrics Collector
Collects genuine operating system metrics using psutil and transmits them
to the SentinelMAT Node.js backend REST API.
"""

import os
import sys
import time
import socket
import platform
import argparse
import logging
from typing import Dict, Any, Optional
import psutil
import requests

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [Collector] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("sentinelmat.collector")


class CollectorConfig:
    def __init__(self):
        self.backend_url = os.getenv("SENTINELMAT_BACKEND_URL", "http://localhost:5000")
        self.interval = float(os.getenv("SENTINELMAT_INTERVAL_SEC", "5.0"))
        self.host_id = os.getenv("SENTINELMAT_HOST_ID", socket.gethostname().lower().replace(" ", "-"))
        self.hostname = os.getenv("SENTINELMAT_HOSTNAME", socket.gethostname())
        self.disk_path = os.getenv("SENTINELMAT_DISK_PATH", "/")
        self.timeout = float(os.getenv("SENTINELMAT_TIMEOUT_SEC", "4.0"))


class MetricsCollector:
    def __init__(self, config: Optional[CollectorConfig] = None):
        self.config = config or CollectorConfig()
        self._last_net_io = psutil.net_io_counters()
        self._last_net_time = time.time()
        self._last_disk_io = psutil.disk_io_counters()
        self._last_disk_time = time.time()
        # Seed cpu_percent initial state
        psutil.cpu_percent(interval=None)

    def get_host_info(self) -> Dict[str, Any]:
        """Gathers static hardware and operating system metadata for registration."""
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage(self.config.disk_path)
        
        # Best effort IP determination
        ip_addr = "127.0.0.1"
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                ip_addr = s.getsockname()[0]
        except Exception:
            try:
                ip_addr = socket.gethostbyname(self.config.hostname)
            except Exception:
                pass

        return {
            "id": self.config.host_id,
            "hostname": self.config.hostname,
            "ip_address": ip_addr,
            "os_info": f"{platform.system()} {platform.release()} ({platform.machine()})",
            "cpu_count": psutil.cpu_count(logical=True) or 1,
            "total_memory_bytes": int(mem.total),
            "total_disk_bytes": int(disk.total)
        }

    def sample_cpu(self) -> Dict[str, Any]:
        """Samples CPU utilization percentage and Linux load averages."""
        cpu_pct = float(psutil.cpu_percent(interval=None))
        load_1, load_5, load_15 = (0.0, 0.0, 0.0)
        try:
            load_avg = os.getloadavg()
            load_1, load_5, load_15 = float(load_avg[0]), float(load_avg[1]), float(load_avg[2])
        except (AttributeError, OSError):
            pass

        return {
            "cpu_utilization": round(cpu_pct, 2),
            "cpu_load_1m": round(load_1, 2),
            "cpu_load_5m": round(load_5, 2),
            "cpu_load_15m": round(load_15, 2)
        }

    def sample_memory(self) -> Dict[str, Any]:
        """Samples physical RAM utilization and byte metrics."""
        mem = psutil.virtual_memory()
        return {
            "memory_utilization": round(float(mem.percent), 2),
            "memory_used_bytes": int(mem.used),
            "memory_total_bytes": int(mem.total)
        }

    def sample_disk(self) -> Dict[str, Any]:
        """Samples filesystem disk usage on configured mount point."""
        disk = psutil.disk_usage(self.config.disk_path)
        return {
            "disk_utilization": round(float(disk.percent), 2),
            "disk_used_bytes": int(disk.used),
            "disk_total_bytes": int(disk.total)
        }

    def sample_network(self) -> Dict[str, Any]:
        """Computes current network transfer rates (bytes/second)."""
        now = time.time()
        dt = max(now - self._last_net_time, 1e-3)
        curr_io = psutil.net_io_counters()

        rx_bytes_sec = (curr_io.bytes_recv - self._last_net_io.bytes_recv) / dt
        tx_bytes_sec = (curr_io.bytes_sent - self._last_net_io.bytes_sent) / dt

        self._last_net_io = curr_io
        self._last_net_time = now

        return {
            "network_rx_bytes_sec": max(0.0, round(float(rx_bytes_sec), 2)),
            "network_tx_bytes_sec": max(0.0, round(float(tx_bytes_sec), 2))
        }

    def collect_sample(self) -> Dict[str, Any]:
        """Assembles a validated metric sample from the Linux host."""
        cpu = self.sample_cpu()
        mem = self.sample_memory()
        disk = self.sample_disk()
        net = self.sample_network()

        sample = {
            "host_id": self.config.host_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **cpu,
            **mem,
            **disk,
            **net,
            "availability": True
        }

        self.validate_sample(sample)
        return sample

    @staticmethod
    def validate_sample(sample: Dict[str, Any]) -> None:
        """Enforces schema boundaries and validity rules on the collected metrics."""
        for pct_metric in ["cpu_utilization", "memory_utilization", "disk_utilization"]:
            val = sample.get(pct_metric)
            if val is None or not (0.0 <= val <= 100.0):
                raise ValueError(f"Invalid metric value for '{pct_metric}': {val}. Must be in [0.0, 100.0].")

        for byte_metric in ["memory_used_bytes", "memory_total_bytes", "disk_used_bytes", "disk_total_bytes"]:
            val = sample.get(byte_metric)
            if val is None or val < 0:
                raise ValueError(f"Invalid byte count for '{byte_metric}': {val}. Must be non-negative.")

        for rate_metric in ["network_rx_bytes_sec", "network_tx_bytes_sec"]:
            val = sample.get(rate_metric)
            if val is None or val < 0.0:
                raise ValueError(f"Invalid transfer rate for '{rate_metric}': {val}. Must be non-negative.")

    def register_host(self) -> bool:
        """Registers or heartbeats the host with the SentinelMAT backend."""
        url = f"{self.config.backend_url.rstrip('/')}/api/hosts/register"
        payload = self.get_host_info()
        try:
            resp = requests.post(url, json=payload, timeout=self.config.timeout)
            if resp.status_code in (200, 201):
                logger.info(f"Host successfully registered with backend: {self.config.host_id}")
                return True
            else:
                logger.warning(f"Host registration returned HTTP {resp.status_code}: {resp.text}")
                return False
        except requests.RequestException as e:
            logger.warning(f"Could not reach backend at {url}: {e}")
            return False

    def send_sample(self, sample: Dict[str, Any]) -> bool:
        """Sends a single metric sample to the backend ingestion endpoint."""
        url = f"{self.config.backend_url.rstrip('/')}/api/metrics"
        try:
            resp = requests.post(url, json=sample, timeout=self.config.timeout)
            if resp.status_code in (200, 201):
                return True
            else:
                logger.warning(f"Metric ingestion returned HTTP {resp.status_code}: {resp.text}")
                return False
        except requests.RequestException as e:
            logger.warning(f"Failed to post metric sample to {url}: {e}")
            return False

    def run_loop(self) -> None:
        """Main periodic polling loop."""
        logger.info(f"Starting SentinelMAT Linux Collector for host: {self.config.host_id}")
        logger.info(f"Backend Target: {self.config.backend_url} | Sampling Interval: {self.config.interval}s")

        # Initial host registration
        registered = False
        while not registered:
            registered = self.register_host()
            if not registered:
                logger.info("Retrying host registration in 3 seconds...")
                time.sleep(3.0)

        # Main collection loop
        while True:
            try:
                t0 = time.time()
                sample = self.collect_sample()
                success = self.send_sample(sample)
                if success:
                    logger.info(
                        f"Sample -> CPU: {sample['cpu_utilization']}% | "
                        f"MEM: {sample['memory_utilization']}% | "
                        f"DISK: {sample['disk_utilization']}% | "
                        f"NET RX: {sample['network_rx_bytes_sec']} B/s"
                    )
                elapsed = time.time() - t0
                sleep_time = max(0.1, self.config.interval - elapsed)
                time.sleep(sleep_time)
            except KeyboardInterrupt:
                logger.info("Collector received interrupt signal. Exiting.")
                break
            except Exception as ex:
                logger.error(f"Unexpected error in collector loop: {ex}", exc_info=True)
                time.sleep(self.config.interval)


def main():
    parser = argparse.ArgumentParser(description="SentinelMAT Linux Metrics Collector")
    parser.add_argument("--backend-url", default=None, help="Node.js Backend URL (e.g. http://localhost:5000)")
    parser.add_argument("--interval", type=float, default=None, help="Polling interval in seconds")
    parser.add_argument("--host-id", default=None, help="Unique Host ID")
    parser.add_argument("--disk-path", default=None, help="Mount point for disk monitoring (default: /)")
    parser.add_argument("--once", action="store_true", help="Collect and output a single sample without sending")
    args = parser.parse_args()

    config = CollectorConfig()
    if args.backend_url:
        config.backend_url = args.backend_url
    if args.interval:
        config.interval = args.interval
    if args.host_id:
        config.host_id = args.host_id
    if args.disk_path:
        config.disk_path = args.disk_path

    collector = MetricsCollector(config)

    if args.once:
        time.sleep(0.5) # allow interval calculation for net/cpu
        sample = collector.collect_sample()
        import json
        print(json.dumps(sample, indent=2))
        return

    collector.run_loop()


if __name__ == "__main__":
    main()
