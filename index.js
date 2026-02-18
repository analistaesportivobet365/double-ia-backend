const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

const BACKEND_URL = "https://blaze-signals-live.preview.emergentagent.com/api/webhook-numero";

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://blaze.bet.br/pt/games/double", { waitUntil: "networkidle2" });

  console.log("🔥 Conectado à Blaze");

  let ultimoResultado = null;

  setInterval(async () => {
    try {
      const resultado = await page.evaluate(() => {
        const tiles = document.querySelectorAll("[class*=tile]");
        for (let el of tiles) {
          const texto = el.innerText?.trim();
          if (!texto || texto.length > 2) continue;

          if (/^\d+$/.test(texto)) {
            const numero = parseInt(texto);
            const classe = el.className.toLowerCase();

            let cor = "BRANCO";
            if (classe.includes("red")) cor = "VERMELHO";
            else if (classe.includes("black")) cor = "PRETO";

            return { numero, cor };
          }
        }
        return null;
      });

      if (!resultado) return;

      const chave = resultado.numero + resultado.cor;
      if (chave === ultimoResultado) return;

      ultimoResultado = chave;

      const horario = new Date().toLocaleTimeString("pt-BR");

      console.log("🎯 Novo resultado:", resultado);

      await fetch(`${BACKEND_URL}?numero=${resultado.numero}&cor=${resultado.cor}&horario=${horario}`);

    } catch (err) {
      console.log("Erro:", err.message);
    }
  }, 2000);

})();