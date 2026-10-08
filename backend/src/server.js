const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL Database connected successfully.');
    client.release();

    app.listen(PORT, () => {
      console.log(`🚀 Recruitment Management System Server running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
