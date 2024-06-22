const { streamFile, stopStreaming } = require('./streamFunctions');
const roomClients = {};

const switchRoom = (socket, room, io) => {
  leaveAllRooms(socket, io);

  socket.join(room);
  if (!roomClients[room]) {
    roomClients[room] = 0;
  }
  roomClients[room]++;

  if (roomClients[room] === 1) {
    streamFile(io, room); // Stream only to the room
  }

  console.log(`Client joined ${room}`);
};

const leaveAllRooms = (socket) => {
  const rooms = Object.keys(socket.rooms).filter(r => r !== socket.id);

  rooms.forEach(room => {
    socket.leave(room);
    roomClients[room]--;

    if (roomClients[room] <= 0) {
      delete roomClients[room];
      stopStreaming(room); // Stop streaming for the room
      console.log(`No more clients in ${room}. Streaming stopped.`);
    }
  });

  console.log(`Client left all rooms: ${rooms}`);
};

module.exports = { leaveAllRooms, switchRoom, roomClients };
