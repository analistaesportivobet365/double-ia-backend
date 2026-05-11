const express = require("express");
const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 10000;

const BLAZE_URL = process.env.BLAZE_URL || "https://blaze.com/pt/games/double";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

let status = {
  online: true,
  lastSpin: null,
  lastError: null,
  startedAt: new Date().toISOString()
};

app.get("/", (req, res) => {
  res.send("🚀 Blaze Collector online");
});

app.get("/status", (req, res) => {
  res.json(status);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  startCollector();
});

function colorFromNumber(number) {
  if (number === 0) return "white";
  if (number >= 1 && number <= 7) return "red";
  if (number >= 8 && number <= 14) return "black";
  return "unknown";
}

async function saveSpin(spin) {
  status.lastSpin = spin;

  if (!supabase) {
    console.log("SUPABASE NÃO CONFIGURADO:", spin);
    return;
  }

  const { error } = await supabase
    .from("giros_blaze")
    .upsert(spin, { onConflict: "hash_unico" });

  if (error) {
    console.error("Erro Supabase:", error.message);
    status.lastError = error.message;
  } else {
    console.log("Giro salvo:", spin);
  }
}

async function startCollector() {
  console.log("Iniciando coletor Playwright...");

  while (true) {
    let browser;

    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage"
        ]
      });

      const page = await browser.newPage({
        viewport: { width: 1366, height: 768 }
      });

      console.log("Abrindo Blaze:", BLAZE_URL);
      await page.goto(BLAZE_URL, {
        waitUntil: "networkidle",
        timeout: 60000
      });

      console.log("Página aberta invisível. Monitorando giros...");

      let lastHash = null;

      setInterval(async () => {
        try {
          const result = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            return bodyText;
          });

          const numbers = result.match(/\b(0|[1-9]|1[0-4])\b/g);

          if (!numbers || numbers.length === 0) return;

          const number = Number(numbers[0]);
          const now = new Date();

          const horario = now.toISOString();
          const hash_unico = `${horario.slice(0, 19)}-${number}`;

          if (hash_unico === lastHash) return;
          lastHash = hash_unico;

          const spin = {
            horario,
            minuto: now.getMinutes(),
            segundo: now.getSeconds(),
            numero: number,
            cor: colorFromNumber(number),
            hash_unico
          };

          await saveSpin(spin);
        } catch (err) {
          console.error("Erro lendo página:", err.message);
          status.lastError = err.message;
        }
      }, 3000);

      break;

    } catch (err) {
      console.error("Erro no coletor:", err.message);
      status.lastError = err.message;

      if (browser) await browser.close().catch(() => {});
      console.log("Tentando reiniciar em 10 segundos...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}
