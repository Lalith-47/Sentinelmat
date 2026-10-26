#!/usr/bin/env python3
"""
SentinelMAT Safe CPU Stress Simulation
Generates controlled arithmetic workload across worker threads/processes for a strict duration.
Never damages the host; automatically terminates when duration expires.
"""

import sys
import time
import math
import argparse
import multiprocessing
import signal

def cpu_worker(stop_event):
    while not stop_event.is_set():
        # High CPU arithmetic cycle with periodic yielding
        for _ in range(50000):
            math.sqrt(1234567.89) * math.sin(45.0)

def main():
    parser = argparse.ArgumentParser(description="SentinelMAT Safe CPU Stress")
    parser.add_argument("--duration", type=int, default=30, help="Stress duration in seconds (default: 30)")
    parser.add_argument("--workers", type=int, default=None, help="Worker count (default: all cores)")
    args = parser.parse_args()

    num_workers = args.workers or max(1, multiprocessing.cpu_count() - 1)
    duration = max(5, min(args.duration, 180)) # bounds: [5, 180] seconds

    print(f"[SentinelMAT:CPU-Stress] Starting CPU load across {num_workers} workers for {duration} seconds...")

    stop_event = multiprocessing.Event()
    processes = []

    def handle_exit(signum, frame):
        print("\n[SentinelMAT:CPU-Stress] Received exit signal. Stopping workers...")
        stop_event.set()
        for p in processes:
            p.join(timeout=1.0)
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    for i in range(num_workers):
        p = multiprocessing.Process(target=cpu_worker, args=(stop_event,), name=f"cpu-stress-{i}")
        p.daemon = True
        p.start()
        processes.append(p)

    start_time = time.time()
    while time.time() - start_time < duration:
        elapsed = int(time.time() - start_time)
        remaining = duration - elapsed
        if elapsed > 0 and elapsed % 5 == 0:
            print(f"[SentinelMAT:CPU-Stress] Running... Elapsed: {elapsed}s, Remaining: {remaining}s")
        time.sleep(1.0)

    print("[SentinelMAT:CPU-Stress] Duration complete. Safely shutting down workers...")
    stop_event.set()
    for p in processes:
        p.join(timeout=2.0)
    print("[SentinelMAT:CPU-Stress] CPU stress concluded safely.")

if __name__ == "__main__":
    main()
