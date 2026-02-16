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
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://blaze.bet.br/pt/games/double", {
    waitUntil: "networkidle2"
  });

  console.log("Blaze conectada. Monitorando...");

  setInterval(async () => {
    try {
      const resultado = await page.evaluate(() => {
        const todos = document.querySelectorAll(".entry .sm-box");
console.log("Total encontrados:", todos.length);
        if (!el) return null;

        let numero = el.innerText.trim();
        let cor = "⚫";

        if (el.classList.contains("red")) cor = "🔴";
        if (el.classList.contains("white")) {
          numero = "0";
          cor = "⚪";
        }

        if (!numero) return null;

        return { numero, cor };
      });

      if (!resultado) return;

      if (resultado.numero === ultimoNumero) return;

      ultimoNumero = resultado.numero;

      console.log("Novo resultado:", resultado.numero, resultado.cor);

      await enviarTelegram(
        `🎯 <b>Novo Resultado</b>\n\n🔢 ${resultado.numero}\n🎨 ${resultado.cor}`
      );

    } catch (err) {
      console.log("Erro leitura:", err.message);
    }
  }, 2000);
}

iniciar();
