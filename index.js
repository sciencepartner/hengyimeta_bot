import { Telegraf } from 'telegraf';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.error('❌ 没有找到 BOT_TOKEN，请在环境变量里配置');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const openai = process.env.OPENAI_KEY ? new OpenAI({ apiKey: process.env.OPENAI_KEY }) : null;

// ====== 在这里改你的业务 ======
const AI_PROMPT = process.env.AI_PROMPT || `你是 hengyimeta_bot，HengYi 团队的官方 AI 助手。
- 语气：专业、友好、简洁，带一点极客感
- 你 7x24小时在线，就算主人关机你也在云端工作
- 用中文回答为主，用户用英文就用英文
- 不要透露你是基于什么模型`;

const KEYWORDS = {
  "你好": "你好！我是 hengyimeta_bot，24/7 在线 🤖 有什么可以帮你？",
  "价格": "目前我们的方案可以私聊详谈，发送 /contact 获取联系方式",
  "联系": "联系 HengYi 团队：发送邮件或直接在这里留言，我会转达",
  "功能": "我可以：\n1. 关键词秒回\n2. AI智能问答\n3. 7x24云端常驻，就算你关电脑我也在"
};

bot.start((ctx) => ctx.reply(`🚀 hengyimeta_bot 已上线！

我是你的 7x24 小时云端机器人，就算你关掉电脑，我也在云端继续工作。

试试发：你好 / 价格 / 功能`));

bot.command('contact', (ctx) => ctx.reply(KEYWORDS["联系"]));

bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  
  // 1. 关键词
  for (const [k, v] of Object.entries(KEYWORDS)) {
    if (text.includes(k)) return ctx.reply(v);
  }

  // 2. AI
  if (openai) {
    await ctx.sendChatAction('typing');
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: AI_PROMPT },
          { role: "user", content: text }
        ],
        temperature: 0.7
      });
      return ctx.reply(completion.choices[0].message.content);
    } catch (e) {
      console.error(e);
      return ctx.reply('AI 暂时开小差了，稍后再试～');
    }
  } else {
    return ctx.reply(`收到：“${text}”\n\n提示：配置 OPENAI_KEY 后我就能用AI智能回复了，现在是关键词模式。`);
  }
});

bot.launch().then(() => console.log('✅ hengyimeta_bot 24/7 运行中...'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
