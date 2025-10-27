export default {
  apps: [
    {
      name: 'window-explorer-backend',
      script: './packages/backend/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL:
          'postgresql://window-explorer:window-explorer_password@localhost:5432/window-explorer_db?schema=public',
        REDIS_URL: 'redis://localhost:6379',
        RABBITMQ_URL: 'amqp://window-explorer:window-explorer_password@localhost:5672',
        SERVICE_ROLE: 'api',
      },
    },
    {
      name: 'window-explorer-worker',
      script: './packages/worker/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL:
          'postgresql://window-explorer:window-explorer_password@localhost:5432/window-explorer_db?schema=public',
        REDIS_URL: 'redis://localhost:6379',
        RABBITMQ_URL: 'amqp://window-explorer:window-explorer_password@localhost:5672',
        SERVICE_ROLE: 'worker',
      },
    },
  ],
}
