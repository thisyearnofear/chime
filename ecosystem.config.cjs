/**
 * CHIME — PM2 ecosystem config for VPS deployment.
 *
 * Deploy: build locally → rsync to /opt/chime/releases/<timestamp> →
 *         update current symlink → pm2 delete chime && pm2 start
 *
 * Env vars live in /opt/chime/shared/.env (symlinked into each release).
 */
module.exports = {
  apps: [
    {
      name: 'chime',
      script: '.next/standalone/server.js',
      interpreter: 'node',
      cwd: '/opt/chime/current',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 9127,
        HOSTNAME: '127.0.0.1',
        NEXT_PUBLIC_NETWORK: 'testnet',
        // Backend URL — separate from frontend (Netlify)
        NEXT_PUBLIC_BASE_URL: 'https://api.chime.trustfall.xyz',
        VENICE_API_KEY: '',
        FEATHERLESS_API_KEY: '',
      },
      error_file: '/opt/chime/logs/pm2-err.log',
      out_file: '/opt/chime/logs/pm2-out.log',
      log_file: '/opt/chime/logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_memory_restart: '512M',
      watch: false,
      kill_timeout: 5000,
      restart_delay: 4000,
    },
  ],
}
