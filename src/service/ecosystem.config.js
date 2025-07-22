module.exports = {
  apps: [
    {
      name: '99AI',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false, // 完全禁用文件监视
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}; 