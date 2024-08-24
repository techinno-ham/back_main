import * as apm from 'elastic-apm-node';

apm.start({
  serviceName: 'hamyar-back-main',
  secretToken: process.env.ELK_CLOUD_SECRET_TOKEN,
  serverUrl: process.env.ELK_CLOUD_SERVER_URL,
  environment: 'hamyarchat'
});