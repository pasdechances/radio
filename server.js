const express = require('express');
const path = require('path');
const socketIo = require('socket.io');
const http = require('http');
const { leaveAllRooms, switchRoom, roomClients } = require('./socketFunctions');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;


io.on('connection', (socket) => {
  console.log('New client connected to lobby');

  socket.on('userMessage', (msg) => {
    const rooms = Object.keys(socket.rooms).filter(r => r !== socket.id);
    if (rooms.length > 0) {
      rooms.forEach(room => {
        io.to(room).emit('serverMessage', msg);
      });
    } else {
      socket.emit('serverMessage', msg); // If no room, send only to the sender
    }
  });

  socket.on('GotoRoom1', () => {
    switchRoom(socket, "Room1", io);
  });

  socket.on('GotoRoom2', () => {
    switchRoom(socket, "Room2", io);
  });

  socket.on('GotoRoom3', () => {
    switchRoom(socket, "Room3", io);
  });

  socket.on('GotoLobby', () => {
    leaveAllRooms(socket);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    leaveAllRooms(socket);
  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(port, () => {
  console.log(`Web radio server running at http://localhost:${port}`);
});



