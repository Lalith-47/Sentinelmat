#!/usr/bin/env python3
"""
SentinelMAT Safe Memory Pressure Simulation
Allocates a strictly bounded buffer of RAM, touches pages to commit memory,
holds for the configured duration, and safely frees all memory upon completion.
"""

import sys
import time
import argparse
import signal
import psutil

def main():
    parser = argparse.ArgumentParser(description="SentinelMAT Safe Memory Pressure")
    parser.add_argument("--duration", type=int, default=30, help="Duration in seconds (default: 30)")
    parser.add_argument("--megabytes", type=int, default=350, help="Target MB to allocate (default: 350MB)")
    args = parser.parse_args()

    # Safety clamp: allocate no more than 15% of available memory or max 800MB
    avail_mb = psutil.virtual_memory().available // (1024 * 1024)
    target_mb = min(args.megabytes, int(avail_mb * 0.20), 800)
    target_mb = max(50, target_mb)
    duration = max(5, min(args.duration, 180))

    print(f"[SentinelMAT:Mem-Pressure] Target Allocation: {target_mb} MB | Available RAM: {avail_mb} MB | Duration: {duration}s")

    allocated_blocks = []

    def cleanup(signum=None, frame=None):
        nonlocal allocated_blocks
        print("\n[SentinelMAT:Mem-Pressure] Releasing allocated memory buffers...")
        allocated_blocks.clear()
        print("[SentinelMAT:Mem-Pressure] Memory released safely.")
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print("[SentinelMAT:Mem-Pressure] Allocating memory buffers...")
    chunk_size = 10 * 1024 * 1024 # 10MB chunks
    chunks_count = target_mb // 10

    for i in range(chunks_count):
        # bytearray with write to ensure pages are physically committed in resident set (RSS)
        block = bytearray(chunk_size)
        for offset in range(0, chunk_size, 4096):
            block[offset] = 0xAA
        allocated_blocks.append(block)

    print(f"[SentinelMAT:Mem-Pressure] Successfully committed {len(allocated_blocks) * 10} MB into physical RAM.")

    start_time = time.time()
    while time.time() - start_time < duration:
        elapsed = int(time.time() - start_time)
        remaining = duration - elapsed
        if elapsed > 0 and elapsed % 5 == 0:
            current_mem = psutil.virtual_memory().percent
            print(f"[SentinelMAT:Mem-Pressure] Holding memory... System RAM used: {current_mem}% | Remaining: {remaining}s")
        time.sleep(1.0)

    cleanup()

if __name__ == "__main__":
    main()
