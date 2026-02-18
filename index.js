const express = require("express");
const app = express();

app.use(express.json());

// Página inicial
app.get("/", (req, res) => {
  res.send("🔥 Servidor Double IA online 24h!");
});

// Webhook para receber sinais
app.post("/sinal", (req, res) => {
  const { numero, cor, horario } = req.body;

  console.log("📩 Sinal recebido:");
  console.log("Número:", numero);
  console.log("Cor:", cor);
  console.log("Horário:", horario);

  res.json({ status: "ok" });
});

// 🔥 IMPORTANTE: usar porta do Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});