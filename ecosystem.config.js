module.exports = {
  apps: [
    {
      name: '99AI',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: true,
      ignore_watch: [
        'node_modules',
        'uploads',
        'uploads/html-images',
        'logs',
        '.git',
        '*.log'
      ],
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}; 