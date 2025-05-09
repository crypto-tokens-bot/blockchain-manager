export const monitoringConfig = {
    updateInterval: 15,
    
    influxdb: {
      url: process.env.INFLUXDB_URL || 'http://localhost:8086',
      token: process.env.INFLUXDB_TOKEN || 'my-super-secret-token',
      org: process.env.INFLUXDB_ORG || 'mmm-fund',
      bucket: process.env.INFLUXDB_BUCKET || 'strategy-monitoring'
    },
    
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DB || 'mmm-fund',
      collection: process.env.MONGODB_COLLECTION || 'strategy-monitoring'
    },
    
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    },
    
    strategy: {
      symbol: 'AXS/USDT',
      targetHedgeRatio: 0.5,
      rebalanceThreshold: 0.05
    },
    
    alerts: {
      telegram: {
        enabled: process.env.TELEGRAM_ALERTS_ENABLED === 'true',
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
      },
      email: {
        enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER,
        smtpPassword: process.env.SMTP_PASSWORD
      }
    }
  };
  
  export default monitoringConfig;