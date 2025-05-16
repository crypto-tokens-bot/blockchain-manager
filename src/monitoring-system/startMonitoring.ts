import { MetricsWriter } from './MetricsWriter';
//import { MetricsCollector } from './';
//import { DashboardAPI } from '../monitoring/DashboardAPI';
import { BybitAdapter } from '../blockchain/exchanges/BybitAdapter';
import { ContractService } from '../blockchain/staking/ContractService';
import { runIndexer } from '../indexer/indexer';
import dotenv from 'dotenv';
import { JsonRpcProvider } from 'ethers';
import { MetricsCollector } from './MetricsCollector';

dotenv.config();

async function startMonitoring() {
  try {
    console.log('Starting comprehensive monitoring system...');

    // Initialize services
    const metricsWriter = MetricsWriter.getInstance();
    const bybitAdapter = new BybitAdapter(process.env.BYBIT_API_KEY!, process.env.BYBIT_API_SECRET!);
    const contractService = new ContractService(process.env.PROVIDER_URL!);
    // Initialize metrics collector
    const metricsCollector = new MetricsCollector(
      contractService,
      bybitAdapter
    );

    // // Start Dashboard API
    // const dashboardAPI = new DashboardAPI(
    //   process.env.INFLUXDB_URL!,
    //   process.env.INFLUXDB_TOKEN!,
    //   metricsCollector
    // );
    // dashboardAPI.start(3002);

    // Start periodic metrics collection
    setInterval(async () => {
      console.log('Collecting all metrics...');
      await metricsCollector.collectAllMetrics();
    }, 30000); // Every 30 seconds

    // Start indexer (it will automatically write to InfluxDB)
    const provider = new JsonRpcProvider(process.env.RPC_URL!);
    await runIndexer(provider);

    console.log('Monitoring system started successfully!');
    //console.log('Dashboard API: http://localhost:3002');
    console.log('Grafana Dashboard: http://localhost:3001');
  } catch (error) {
    console.error('Failed to start monitoring:', error);
    process.exit(1);
  }
}

startMonitoring();