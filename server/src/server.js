require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { seedInitialData } = require('./utils/seeder');
const reminderScheduler = require('./services/reminderScheduler');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect to Database (Atlas or local in-memory fallback)
    await connectDB();

    // 2. Seed initial admin and sample data if needed
    await seedInitialData();

    // 3. Start Scheduled Cron Job
    reminderScheduler.startScheduler();

    // 4. Start HTTP Server
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Document Expiry Reminder Server Running`);
      console.log(`  Port:        http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Timezone:    ${process.env.TIMEZONE || 'Asia/Kolkata'}`);
      console.log(`====================================================`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      reminderScheduler.stopScheduler();
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Closed all connections. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('[Server] Fatal startup failure:', err);
    process.exit(1);
  }
}

startServer();
