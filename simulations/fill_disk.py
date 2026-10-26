#!/usr/bin/env python3
"""
SentinelMAT Safe Disk Growth Simulation
Simulates gradual disk growth in a disposable scratch directory to demonstrate
MATLAB Ordinary Least Squares capacity forecasting and Time-To-Exhaustion (TTE) modeling.
Guarantees complete automatic cleanup upon exit.
"""

import os
import sys
import time
import shutil
import argparse
import signal
import psutil

TEST_VOLUME = "/tmp/sentinelmat_test_volume"

def main():
    parser = argparse.ArgumentParser(description="SentinelMAT Safe Disk Growth Simulation")
    parser.add_argument("--duration", type=int, default=30, help="Simulation duration in seconds (default: 30)")
    parser.add_argument("--target-mb", type=int, default=300, help="Target MB to create in chunks (default: 300MB)")
    args = parser.parse_args()

    # Safety check on disk space
    free_mb = psutil.disk_usage("/tmp").free // (1024 * 1024)
    target_mb = min(args.target_mb, int(free_mb * 0.10), 1000)
    target_mb = max(20, target_mb)
    duration = max(5, min(args.duration, 180))

    os.makedirs(TEST_VOLUME, exist_ok=True)
    created_files = []

    def cleanup(signum=None, frame=None):
        print(f"\n[SentinelMAT:Disk-Growth] Cleaning up disposable volume {TEST_VOLUME}...")
        try:
            shutil.rmtree(TEST_VOLUME, ignore_errors=True)
            print("[SentinelMAT:Disk-Growth] Disposable volume purged safely.")
        except Exception as e:
            print(f"[SentinelMAT:Disk-Growth] Error during cleanup: {e}")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print(f"[SentinelMAT:Disk-Growth] Initializing gradual growth in {TEST_VOLUME}...")
    print(f"[SentinelMAT:Disk-Growth] Target: {target_mb} MB over {duration} seconds.")

    chunk_size = 5 * 1024 * 1024 # 5MB per chunk
    total_chunks = target_mb // 5
    interval = duration / max(1, total_chunks)

    start_time = time.time()
    for chunk_idx in range(total_chunks):
        if time.time() - start_time >= duration:
            break

        file_path = os.path.join(TEST_VOLUME, f"growth_chunk_{chunk_idx}.dat")
        with open(file_path, "wb") as f:
            f.write(os.urandom(chunk_size))
        created_files.append(file_path)

        curr_disk = psutil.disk_usage(TEST_VOLUME).percent
        total_created = (chunk_idx + 1) * 5
        print(f"[SentinelMAT:Disk-Growth] Wrote chunk {chunk_idx + 1}/{total_chunks} (+5MB) | Total: {total_created}MB | Disk %: {curr_disk}")
        time.sleep(interval)

    # Hold remaining duration
    remaining = duration - (time.time() - start_time)
    if remaining > 0:
        time.sleep(remaining)

    cleanup()

if __name__ == "__main__":
    main()
