require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket/socketHandlers');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🎵 SyncWave server running on port ${PORT}`);
});
