process.stdout.write('Server starting\n');
require('dotenv').config();

process.stdout.write('Config loaded\n');
const Telegraf = require('telegraf');
const rateLimit = require('telegraf-ratelimit');
const fs = require('fs');
const db = require('./src/database');
const InitContext = require('./src/contexts/InitContext');
const ListContext = require('./src/contexts/ListContext');
const AdminContext = require('./src/contexts/AdminContext');

let bot = new Telegraf(process.env.BOT_TOKEN, { username: process.env.BOT_USERNAME });
bot.use(rateLimit({
  window: process.env.LIMIT_MS || 2000,
  limit: process.env.LIMIT_MESSAGES || 3,
  keyGenerator: (ctx) => ctx.from
    && ctx.from.id
    && ctx.chat
    && ctx.chat.id
    && ctx.message
    && ctx.message.text !== `@${process.env.BOT_USERNAME} get`,
  onLimitExceeded: (ctx, next) => {
    if (ctx.chat.type === 'private') {
      ctx.reply('Rate limit exceeded, try again in a few seconds!');
    } else {
      next();
    }
  },
}));
bot = new InitContext(bot, db);
bot = new ListContext(bot, db);
bot = new AdminContext(bot, db);

if (process.env.WEBHOOK) {
  let tlsOptions = null;
  if (process.env.WEBHOOK_TLS) {
    tlsOptions = {
      key: fs.readFileSync(process.env.SERVER_KEY),
      cert: fs.readFileSync(process.env.SERVER_CERT),
    };
    if (process.env.CLIENT_CERT) {
      tlsOptions.ca = [fs.readFileSync(process.env.CLIENT_CERT)];
    }
  }
  bot.telegram.setWebhook(process.env.WEBHOOK_URL, {
    source: process.env.SERVER_CERT,
  });
  bot.startWebhook(process.env.WEBHOOK_PATH, tlsOptions, process.env.WEBHOOK_PORT);
} else {
  bot.startPolling();
}
process.stdout.write('Server running\n');
