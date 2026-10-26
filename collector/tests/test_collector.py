"""
Unit tests for SentinelMAT Linux Metrics Collector
"""

import pytest
import time
from collector.metrics_collector import MetricsCollector, CollectorConfig


def test_collector_config_defaults():
    cfg = CollectorConfig()
    assert cfg.backend_url is not None
    assert cfg.interval > 0
    assert cfg.host_id != ""


def test_collect_real_sample():
    collector = MetricsCollector()
    time.sleep(0.1)
    sample = collector.collect_sample()

    assert sample["host_id"] != ""
    assert "timestamp" in sample
    assert 0.0 <= sample["cpu_utilization"] <= 100.0
    assert 0.0 <= sample["memory_utilization"] <= 100.0
    assert 0.0 <= sample["disk_utilization"] <= 100.0
    assert sample["memory_used_bytes"] > 0
    assert sample["disk_used_bytes"] > 0
    assert sample["network_rx_bytes_sec"] >= 0.0
    assert sample["network_tx_bytes_sec"] >= 0.0
    assert sample["availability"] is True


def test_sample_validation_rejects_invalid_values():
    collector = MetricsCollector()
    invalid_sample = {
        "cpu_utilization": 150.0, # out of range
        "memory_utilization": 50.0,
        "disk_utilization": 50.0,
        "memory_used_bytes": 100,
        "memory_total_bytes": 200,
        "disk_used_bytes": 100,
        "disk_total_bytes": 200,
        "network_rx_bytes_sec": 10.0,
        "network_tx_bytes_sec": 10.0
    }
    with pytest.raises(ValueError, match="Invalid metric value for 'cpu_utilization'"):
        collector.validate_sample(invalid_sample)


def test_host_info_metadata():
    collector = MetricsCollector()
    info = collector.get_host_info()

    assert "hostname" in info
    assert "os_info" in info
    assert info["cpu_count"] >= 1
    assert info["total_memory_bytes"] > 0
    assert info["total_disk_bytes"] > 0
