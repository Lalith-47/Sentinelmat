-- SentinelMAT Seed Data
-- database/seeds/seed_data.sql

-- Default Alert Rules
INSERT INTO alert_rules (name, metric_type, condition, threshold_value, duration_seconds, severity, enabled, cooldown_minutes, notify_telegram)
VALUES
    ('High CPU Utilization', 'cpu', 'gt', 85.0, 30, 'high', true, 15, false),
    ('Critical Memory Exhaustion', 'memory', 'gt', 92.0, 30, 'critical', true, 10, false),
    ('Critical Disk Capacity', 'disk', 'gt', 90.0, 60, 'critical', true, 30, false),
    ('CPU Statistical Anomaly (Z-Score)', 'cpu', 'z_score_gt', 3.0, 15, 'high', true, 15, false),
    ('Rapid Disk Space Exhaustion Forecast', 'disk', 'tte_lt', 48.0, 60, 'critical', true, 60, false),
    ('Network Anomaly Burst', 'network_rx', 'z_score_gt', 3.5, 15, 'medium', true, 20, false)
ON CONFLICT DO NOTHING;
