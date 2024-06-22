const express = require('express');
const path = require('path');
const socketIo = require('socket.io');
const http = require('http');
const { streamFile } = require('./function');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

io.on('connection', (socket) => {
  console.log('New client connected to lobby');

  socket.on('userMessage', (msg) => {
    console.log(msg);
    io.emit('serverMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/lecteur', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(port, () => {
  console.log(`Web radio server running at http://localhost:${port}`);
  streamFile(io);
});
