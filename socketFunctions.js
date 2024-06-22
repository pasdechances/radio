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
    streamFile(io, room);
  }
  console.log(`${roomClients[room]} Client in room: ${room}`);
};

const leaveAllRooms = (socket) => {
  const rooms = Object.keys(socket.rooms).filter(r => r !== socket.id);

  rooms.forEach(room => {
    socket.leave(room);
    roomClients[room]--;

    if (roomClients[room] <= 0) {
      stopStreaming(room);
      console.log(`No more clients in ${room}. Streaming stopped.`);
    }
    else{
      console.log(`${roomClients[room]} Client remaning in room: ${room}`);
    }
  });
};

module.exports = { leaveAllRooms, switchRoom, roomClients };
