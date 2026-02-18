const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Rota de teste
app.get("/", (req, res) => {
  res.send("🚀 Double IA Backend online");
});

// Webhook para receber sinais
app.post("/webhook", (req, res) => {
  const { numero, cor, horario } = req.body;

  console.log("🎯 Sinal recebido:");
  console.log("Número:", numero);
  console.log("Cor:", cor);
  console.log("Horário:", horario);

  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});