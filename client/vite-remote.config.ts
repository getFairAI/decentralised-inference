import mainConfig from './vite.config';
import fs from 'fs';

// https://vitejs.dev/config/
export default {
  ...mainConfig,
  server: {
    host: '0.0.0.0',
    https: {
      cert: fs.readFileSync('./httpscerts/cert.pem'),
      key: fs.readFileSync('./httpscerts/key.pem'),
      passphrase: 'fairai',
    },
  },
};
