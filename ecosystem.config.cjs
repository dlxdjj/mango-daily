module.exports = {
  apps: [
    {
      name: 'mango-daily-api',
      cwd: __dirname,
      script: 'packages/server/dist/index.js',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
