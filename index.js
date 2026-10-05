require('http').createServer((req,res)=>res.end('hengyimeta_bot is running - DeepSeek')).listen(process.env.PORT||10000);

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!BOT_TOKEN) {
  console.error("❌ 请设置 BOT_TOKEN");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log("✅ hengyimeta_bot 24/7 运行中... (DeepSeek 驱动)");

async function askDeepSeek(prompt) {
  if (!DEEPSEEK_API_KEY) {
    return "你好！我已上线，但还没配置 DEEPSEEK_API_KEY。\\n去 Render -> Environment 加上你的 Key 就能智能对话了。";
  }
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是 hengyimeta_bot，由 Meta AI 打造，语气像靠谱的秘书。用户中文你就中文。" },
          { role: "user", content: prompt }
        ]
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "DeepSeek 暂时没回，稍后再试。";
  } catch (e) {
    console.error(e);
    return "网络连接 DeepSeek 失败。";
  }
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";
  if (!text) return;
  if (text.startsWith('/start')) {
    bot.sendMessage(chatId, "你好！我是 hengyimeta_bot，已接入 DeepSeek，24/7 在线，直接聊就行。");
    return;
  }
  bot.sendChatAction(chatId, 'typing');
  const reply = await askDeepSeek(text);
  bot.sendMessage(chatId, reply);
});
