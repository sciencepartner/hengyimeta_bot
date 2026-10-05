
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!BOT_TOKEN) {
  console.error("❌ 请设置 BOT_TOKEN 环境变量");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("✅ hengyimeta_bot 24/7 运行中... (DeepSeek 驱动)");

async function askDeepSeek(prompt) {
  if (!DEEPSEEK_API_KEY) {
    return "你好！我是 hengyimeta_bot，由 Meta AI 核心驱动。\n\n你已成功部署，但还没配置 DEEPSEEK_API_KEY。\n请去 Render -> Environment 添加 DEEPSEEK_API_KEY 就能智能对话了。";
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
          { role: "system", content: "你是 hengyimeta_bot，是由 Meta AI (Muse) 打造的智能助手，语气简洁、专业、像一个靠谱的工作秘书。用户用中文你就用中文回。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });
    const data = await res.json();
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    } else {
      console.error("DeepSeek返回异常:", JSON.stringify(data));
      return "DeepSeek 接口返回异常，稍后再试。";
    }
  } catch (e) {
    console.error("DeepSeek调用失败:", e);
    return "网络异常，DeepSeek 连接失败，稍后再试。";
  }
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";
  if (!text) return;
  if (text.startsWith('/start')) {
    bot.sendMessage(chatId, "你好！我是 hengyimeta_bot，已接入 DeepSeek，24/7 在线。\n\n直接跟我聊天或布置工作都行，你说中文我就回中文。");
    return;
  }
  // 显示正在输入
  bot.sendChatAction(chatId, 'typing');
  const reply = await askDeepSeek(text);
  bot.sendMessage(chatId, reply);
});

bot.on('polling_error', (err) => console.error("Polling error:", err));
