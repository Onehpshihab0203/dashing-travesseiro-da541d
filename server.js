/*
 * SpaceSkribble – multiplayer server (Node.js + Socket.IO)
 * --------------------------------------------------------
 * Run:  npm install  &&  npm start   →  http://localhost:3000
 *
 * Serves the static game from /public and hosts game rooms so players on
 * different devices can play together. All game rules live in
 * public/engine.js, which is shared with the browser.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const { Room, makeRoomCode } = require('./public/engine.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const TICK_MS = 250;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

// ── tiny static file server ──
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // On Netlify, /.netlify/images resizes pictures. Locally we just serve the original.
  if (url.pathname === '/.netlify/images') {
    res.writeHead(302, { Location: url.searchParams.get('url') || '/' });
    return res.end();
  }

  let file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(url.pathname)));
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && !path.extname(file)) file += '.html';

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

// ── Socket.IO rooms ──
const io = new Server(server, { cors: { origin: '*' } });
const rooms = new Map(); // code → Room

function createRoom() {
  let code;
  do code = makeRoomCode();
  while (rooms.has(code));
  const room = new Room({
    code,
    // Deliver engine events: 'all', a socket id, or { except: socketId }
    emit(to, event, payload) {
      if (to === 'all') io.to(code).emit('evt', { event, payload });
      else if (to && to.except) io.to(code).except(to.except).emit('evt', { event, payload });
      else io.to(to).emit('evt', { event, payload });
    },
  });
  rooms.set(code, room);
  return room;
}

io.on('connection', (socket) => {
  let room = null;

  function enter(target, profile) {
    const result = target.join(socket.id, profile);
    if (result.error) return socket.emit('evt', { event: 'error', payload: { message: result.error } });
    room = target;
    socket.join(target.code);
    socket.emit('evt', { event: 'joined', payload: { code: target.code, you: socket.id } });
    target.broadcastState();
  }

  socket.on('create', (profile) => {
    if (room) return;
    enter(createRoom(), profile);
  });

  socket.on('join', ({ code, ...profile } = {}) => {
    if (room) return;
    const target = rooms.get(String(code || '').toUpperCase().trim());
    if (!target) return socket.emit('evt', { event: 'error', payload: { message: 'Room not found. Check the code and try again.' } });
    enter(target, profile);
  });

  // Every in-game action goes through here.
  socket.on('action', ({ type, payload } = {}) => {
    if (!room) return;
    const id = socket.id;
    switch (type) {
      case 'ready': return room.setReady(id, payload);
      case 'settings': return room.updateSettings(id, payload);
      case 'addBot': return room.addBot(id);
      case 'kick': return room.kick(id, payload);
      case 'start': return room.start(id);
      case 'choose': return room.choose(id, payload);
      case 'draw': return room.draw(id, payload);
      case 'guess': return room.guess(id, payload);
      case 'playAgain': return room.playAgain(id);
    }
  });

  socket.on('disconnect', () => {
    if (!room) return;
    room.leave(socket.id);
    if (room.isEmpty()) rooms.delete(room.code);
  });
});

// One clock for every room keeps timers in sync for all players.
setInterval(() => {
  for (const room of rooms.values()) room.tick(TICK_MS);
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`🚀 SpaceSkribble running at http://localhost:${PORT}`);
});
