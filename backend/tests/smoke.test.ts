import { checkDbHealth } from '../src/db';
import { MatlabRunner } from '../src/matlab/MatlabRunner';
import { HostRepository } from '../src/repositories/HostRepository';
import { MetricsRepository } from '../src/repositories/MetricsRepository';

async function runSmokeTests() {
  console.log('--- Starting SentinelMAT Backend Smoke Tests ---');

  // 1. PostgreSQL Health Check
  console.log('1. Testing PostgreSQL connection...');
  const dbHealth = await checkDbHealth();
  if (!dbHealth.healthy) {
    throw new Error(`DB Health check failed: ${dbHealth.error}`);
  }
  console.log(`   PostgreSQL Healthy! Latency: ${dbHealth.latencyMs}ms`);

  // 2. Host Registration
  console.log('2. Testing Host Upsert...');
  const testHost = await HostRepository.upsert({
    id: 'test-arch-host',
    hostname: 'arch-sentinel-test',
    ip_address: '192.168.1.100',
    os_info: 'Linux Arch 6.10',
    cpu_count: 8,
    total_memory_bytes: 16000000000,
    total_disk_bytes: 500000000000,
  });
  if (testHost.id !== 'test-arch-host') {
    throw new Error('Host upsert failed');
  }
  console.log(`   Host persisted successfully: ${testHost.id}`);

  // 3. Metric Sample Ingestion
  console.log('3. Testing Metric Sample Insertion...');
  const sample = await MetricsRepository.insert({
    host_id: 'test-arch-host',
    timestamp: new Date(),
    cpu_utilization: 45.5,
    cpu_load_1m: 1.2,
    cpu_load_5m: 1.1,
    cpu_load_15m: 0.9,
    memory_utilization: 62.0,
    memory_used_bytes: 9920000000,
    memory_total_bytes: 16000000000,
    disk_utilization: 75.0,
    disk_used_bytes: 375000000000,
    disk_total_bytes: 500000000000,
    network_rx_bytes_sec: 50000,
    network_tx_bytes_sec: 25000,
    availability: true,
  });
  if (!sample.id) {
    throw new Error('Sample insertion failed');
  }
  console.log(`   Sample persisted with ID: ${sample.id}`);

  // 4. MATLAB Engine Pipeline
  console.log('4. Testing MATLAB / Octave Engine Runner...');
  const engineHealth = await MatlabRunner.checkHealth();
  if (!engineHealth.available) {
    throw new Error(`MATLAB engine runner failed: ${engineHealth.error}`);
  }
  console.log(`   MATLAB Engine is ONLINE! Version: ${engineHealth.engineVersion} (Latency: ${engineHealth.latencyMs}ms)`);

  console.log('--- ALL BACKEND SMOKE TESTS PASSED! ---');
  process.exit(0);
}

runSmokeTests().catch((err) => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});
