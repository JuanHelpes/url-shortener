require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const usersRoutes = require("./routes/urlsRoutes");
const connectToDataBase = require("./database");

// Conecta ao banco de dados
connectToDataBase();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Ajuste conforme sua origem
});

// Middleware
app.use(cors());
app.use(express.json());

// Disponibiliza o `io` para o controller via app.locals
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rotas da API REST
app.use("/api", usersRoutes);

// Eventos de conexão via socket
io.on("connection", (socket) => {
  console.log("🧠 Cliente conectado via Socket.IO:", socket.id);
});

// Inicia servidor com rotas
const port = process.env.PORT || 3333;
server.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
