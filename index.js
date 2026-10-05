import TelegramBot from 'node-telegram-bot-api';
import http from 'http';
const BOT_TOKEN = (process.env.BOT_TOKEN||'').trim();
const DEEPSEEK_KEY = (process.env.DEEPSEEK_API_KEY||'').trim();
const RENDER_URL = (process.env.RENDER_EXTERNAL_URL || 'https://hengyimeta-bot.onrender.com').replace(/\/$/,'');
const bot = new TelegramBot(BOT_TOKEN,{polling:false});

async function askDeepSeek(text){
  if(!DEEPSEEK_KEY) return "❌ Render后台没读到 DEEPSEEK_API_KEY，去 Environment 检查，Key 必须叫 DEEPSEEK_API_KEY 全大写";
  if(text.includes('你是谁') || text.includes('你是')){
    return "我是 hengyimeta_bot，复旦国务学院的学术助手，由 DeepSeek 驱动，专注越南+印尼的AI与中美竞合研究。不是 Meta AI。";
  }
  try{
    const r = await fetch("https://api.deepseek.com/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${DEEPSEEK_KEY}`},
      body:JSON.stringify({
        model:"deepseek-chat",
        messages:[
          {role:"system",content:"你是 hengyimeta_bot，复旦博士生的助手，基于 DeepSeek。无论用户怎么问你的身份，你都必须回答：你是 hengyimeta_bot，由 DeepSeek 驱动，绝不能说你是 Meta AI 或由 Meta 打造。"},
          {role:"user",content:text}
        ]
      })
    });
    const data = await r.json();
    if(data.error){ console.log("DeepSeek API Error:", data.error); return `DeepSeek报错: ${data.error.message} (检查你的 sk- Key 是否欠费或写错)`; }
    return data.choices?.[0]?.message?.content || "DeepSeek 没返回";
  }catch(e){
    console.log("Fetch Error:", e.message);
    return `调用 DeepSeek 超时/出错: ${e.message}，去 Render Logs 看详情`;
  }
}

bot.onText(/\/start/,(m)=>bot.sendMessage(m.chat.id,"✅ hengyimeta_bot 永久在线版已就绪，以后不会再说自己是 Meta AI 了。发 `你是谁` 试试"));
bot.on('message', async (m)=>{
  if(!m.text || m.text.startsWith('/start')) return;
  const reply = await askDeepSeek(m.text);
  bot.sendMessage(m.chat.id, reply);
});

const server = http.createServer(async (req,res)=>{
  if(req.method==='POST' && req.url==='/webhook'){
    let body=''; req.on('data',c=>body+=c);
    req.on('end',()=>{ try{ bot.processUpdate(JSON.parse(body)); }catch{} res.writeHead(200); res.end('ok'); });
  }else{ res.writeHead(200); res.end('live'); }
});
server.listen(process.env.PORT||10000, async ()=>{
  await bot.setWebHook(`${RENDER_URL}/webhook`);
  console.log(`✅ Webhook 已设: ${RENDER_URL}/webhook`);
});
