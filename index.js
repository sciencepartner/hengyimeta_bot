import TelegramBot from 'node-telegram-bot-api';
import http from 'http';

const BOT_TOKEN = (process.env.BOT_TOKEN || '').trim();
const DEEPSEEK_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();
const RENDER_URL = (process.env.RENDER_EXTERNAL_URL || 'https://hengyimeta-bot.onrender.com').replace(/\/$/, '');

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function askDeepSeek(text){
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是 hengyimeta_bot，复旦国务学院博士生的学术助手，研究方向是AI、中美科技竞合、职业教育、国际安全，重点案例越南+印尼。自称 hengyimeta_bot，由DeepSeek驱动。" },
        { role: "user", content: text }
      ]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "DeepSeek 没返回";
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "✅ hengyimeta_bot 已永久在线（Webhook模式）\n以后不会再睡了。你可以随时发论文、问越南/印尼情报。");
});
bot.on('message', async (msg) => {
  if(!msg.text || msg.text.startsWith('/start')) return;
  const reply = await askDeepSeek(msg.text);
  bot.sendMessage(msg.chat.id, reply);
});

// HTTP 服务器：既保活，又接收 Telegram 的 Webhook
const server = http.createServer(async (req, res) => {
  if(req.method === 'POST' && req.url === '/webhook'){
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try{ const update = JSON.parse(body); bot.processUpdate(update); } catch(e){}
      res.writeHead(200); res.end('ok');
    });
  } else {
    res.writeHead(200); res.end('hengyimeta_bot live - webhook mode');
  }
});

server.listen(process.env.PORT || 10000, async () => {
  console.log("✅ Web Service 启动");
  // 关键：告诉 Telegram，以后把消息推到这个网址
  const webhookUrl = `${RENDER_URL}/webhook`;
  try{
    await bot.setWebHook(webhookUrl);
    console.log(`✅ Webhook 已设置: ${webhookUrl}`);
  }catch(e){ console.log("Webhook设置失败", e.message); }
});
