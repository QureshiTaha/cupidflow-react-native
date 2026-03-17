module.exports = {
  apps: [
    {
      name: 'dilmilBackendApp',
      script: 'index.js',  // Entry point for the app
      instances: 'max',    // Scale the app to the number of CPU cores
      exec_mode: 'cluster', // Cluster mode for scaling
      watch: false,        // Disable watch in production
      autorestart: true,   // Restart on failure
      restart_delay: 5000, // Delay between restarts
      max_restarts: 10,    // Max restart attempts
      env: {
        NODE_ENV: 'production', // Set production environment
      },
      error_file: './logs/error.log',  // Error logs
      out_file: './logs/output.log',   // Standard output logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss', // Timestamp format for logs
      pid_file: './logs/app.pid', // Process ID file for PM2
      merge_logs: true, // Merge logs from all instances
    },
  ],
};
