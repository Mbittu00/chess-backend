let Uid = require("./uid");

const io = require("socket.io")(process.env.PORT||8900, {
  cors: {
    origin: "*",
  },
});

let users = [];
let game = [];
let requests = [];
let addUser = (id, socket) => {
  let some = users.some((n) => n.id == id);
  if (some) {
    users = users.filter((n) => n.id != id);
    users.push({ id, isPalying: false, socketId: socket.id });
  } else {
    users.push({ id, isPalying: false, socketId: socket.id });
  }
};

let request = (res, socket) => {
  let some = users.some((n) => n.id == res);
  if (some) {
    let find = users.find((n) => n.id == res);
    let me = users.find((n) => n.socketId == socket.id);
    if (!find.isPalying) {
      io.to(find.socketId).emit("send", me);
      //console.log(me.id)
      requests.push({ sender: me.id, reciver: find.id });
    }
  }
};

let gameUpdate = (res, socket) => {
  let myGame = game.find((n) => n.gameId == res.gameId);
  let w = users.find((n) => n.id == myGame.w);
  let b = users.find((n) => n.id == myGame.b);
  game = game.filter((n) => n.gameId !== res.gameId);
  game.push(res);
  io.to(w.socketId).emit("played", res);
  io.to(b.socketId).emit("played", res);
  console.log({game});
};

let addToGame = (res, socket) => {
  let find = requests.find((n) => n.reciver == res);
  requests = requests.filter((n) => n.sender != find.sender);
  let w = users.find((n) => n.id == find.sender);
  let b = users.find((n) => n.id == find.reciver);
  let obj = {
    w: find.sender,
    b: find.reciver,
    gameId: Uid(),
    turn: "w",
    position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  };
  game.push(obj);
  io.to(w.socketId).emit("game", obj);
  io.to(b.socketId).emit("game", obj);
 // console.log(obj);
};

io.on("connection", (socket) => {
  console.log("connection");
  socket.emit('online',true)
  
  socket.on("join", (id) => {
    addUser(id, socket);
  });
  socket.on("request", (res) => {
    request(res, socket);
  });

  socket.on("accept", (res) => {
    addToGame(res, socket);
  });

  socket.on("update", (res) => {
    console.log(res.gameId);
    gameUpdate(res, socket);
  });

  socket.on("disconnect", () => {});
});
