import express from 'express';
import fs from 'fs';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const DB_FILE = 'database.json';

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ sinais: [] }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get('/', (req, res) => {
  res.json({ status: 'Double IA Backend Online 🚀' });
});

app.post('/sinal', (req, res) => {
  const { horario, cor } = req.body;
  const db = readDB();

  db.sinais.push({
    horario,
    cor_sinal: cor,
    resultado: null,
    criado_em: new Date()
  });

  saveDB(db);

  res.json({ mensagem: 'Sinal registrado' });
});

app.post('/resultado', (req, res) => {
  const { horario, cor } = req.body;
  const db = readDB();

  const sinal = db.sinais.find(
    s => s.horario === horario && s.resultado === null
  );

  if (!sinal) {
    return res.status(404).json({ erro: 'Sinal não encontrado' });
  }

  sinal.resultado = cor;
  saveDB(db);

  res.json({ mensagem: 'Resultado registrado' });
});

app.get('/estatisticas', (req, res) => {
  const db = readDB();

  let wins = 0;
  let loss = 0;

  db.sinais.forEach(s => {
    if (s.resultado) {
      if (s.cor_sinal === s.resultado) wins++;
      else loss++;
    }
  });

  const total = wins + loss;
  const taxa = total > 0 ? ((wins / total) * 100).toFixed(2) : 0;

  res.json({ total, wins, loss, taxa });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
