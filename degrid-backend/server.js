import dotenv from 'dotenv';
import createApp from './app.js';
import { connectDatabase } from './config/database.js';
import cellService from './services/cellService.js';
import challengeService from './services/challengeService.js';
import playerService from './services/playerService.js';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    console.log('🚀 Starting Degrid Game API Server...');
    console.log(`📦 Environment: ${NODE_ENV}`);

    // Connect to database
    const isDbConnected = await connectDatabase();

  // Set data source for services we actively use
  const useMockData = !isDbConnected;
  // Note: gameService and queueService are archived / not required for the
  // simplified in-memory dev flow used by the frontend. We avoid importing
  // them here so the server can start without shims.
  cellService.setDataSource(useMockData);
  challengeService.setDataSource(useMockData);
  playerService.setDataSource(useMockData);

    if (useMockData) {
      console.log('💾 Using MOCK DATA (in-memory storage)');
      console.log('   To use MongoDB, set MONGODB_URI in your .env file');
    } else {
      console.log('💾 Using MongoDB (persistent storage)');
    }

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('✅ Server is running!');
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(` Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('Available Endpoints:');

      // Dynamically list registered routes from the Express app so we only show current endpoints
      const getRoutes = (app) => {
        const routes = [];
        if (!app || !app._router) return routes;
        app._router.stack.forEach((layer) => {
          if (layer.route && layer.route.path) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
            routes.push({ path: layer.route.path, methods });
          } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            layer.handle.stack.forEach((handler) => {
              if (handler.route && handler.route.path) {
                const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase()).join(',');
                routes.push({ path: handler.route.path, methods });
              }
            });
          }
        });
        return routes;
      };

      const routes = getRoutes(app);
      for (const r of routes) {
        console.log(`  - ${r.methods.padEnd(6)} ${r.path}`);
      }

      console.log('');
      console.log('Press Ctrl+C to stop the server');
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        if (isDbConnected) {
          const { closeDatabase } = await import('./config/database.js');
          await closeDatabase();
        }
        
        console.log('✅ Server shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
