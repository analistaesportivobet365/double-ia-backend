import puppeteer from "puppeteer";
import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

let ultimoNumero = null;

async function enviarTelegram(msg) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: msg,
        parse_mode: "HTML"
      })
    });
  } catch (err) {
    console.log("Erro Telegram:", err.message);
  }
}

async function iniciar() {
  console.log("Iniciando Double IA 24h...");

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
  );

  await page.goto("https://blaze.bet.br/pt/games/double", {
    waitUntil: "domcontentloaded"
  });

  console.log("Página carregada. Monitorando histórico...");

  setInterval(async () => {
    try {
      const resultado = await page.evaluate(() => {

        // Pega histórico superior
        const historico = document.querySelectorAll("div[class*='entry']");

        if (!historico.length) return null;

        const primeira = historico[0];

        const numero = primeira.innerText.trim();

        if (!numero) return null;

        let cor = "⚫";

        if (primeira.classList.toString().includes("red")) {
          cor = "🔴";
        }

        if (primeira.classList.toString().includes("white")) {
          cor = "⚪";
        }

        return { numero, cor };
      });

      if (!resultado) return;

      if (resultado.numero === ultimoNumero) return;

      ultimoNumero = resultado.numero;

      console.log("Novo resultado:", resultado.numero, resultado.cor);

      await enviarTelegram(
        `🚀 <b>SERVER DOUBLE IA 24H</b>\n\n🎯 Resultado\n🔢 ${resultado.numero}\n🎨 ${resultado.cor}`
      );

    } catch (err) {
      console.log("Erro leitura:", err.message);
    }
  }, 3000);
}

iniciar();
