import puppeteer from "puppeteer";
import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

let ultimoNumero = null;

async function enviarTelegram(msg) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: msg,
      parse_mode: "HTML"
    })
  });
}

async function iniciar() {
  console.log("Iniciando Double IA 24h...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://blaze.bet.br/pt/games/double", {
    waitUntil: "domcontentloaded"
  });

  console.log("Aguardando roleta carregar...");

  await page.waitForSelector(".entry", { timeout: 60000 });

  console.log("Roleta detectada. Monitorando...");

  setInterval(async () => {
    try {
      const resultado = await page.evaluate(() => {

        const entradas = document.querySelectorAll(".entry");
        if (!entradas.length) return null;

        const ultima = entradas[0];
        const box = ultima.querySelector(".sm-box");
        if (!box) return null;

        let numero = box.innerText.trim();
        let cor = "⚫";

        if (box.classList.contains("red")) cor = "🔴";
        if (box.classList.contains("white")) {
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
        `🚀 <b>SERVER 24H</b>\n\n🎯 Novo Resultado\n🔢 ${resultado.numero}\n🎨 ${resultado.cor}`
      );

    } catch (err) {
      console.log("Erro:", err.message);
    }
  }, 2000);
}

iniciar();
