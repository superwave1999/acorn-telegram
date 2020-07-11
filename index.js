process.stdout.write('Server starting\n');
require('dotenv').config();

process.stdout.write('Config loaded\n');
const Telegraf = require('telegraf');
const TelegrafI18n = require('telegraf-i18n');
const rateLimit = require('telegraf-ratelimit');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const applyRateLimit = require('./src/helpers/applyRateLimit');
const cronCleanup = require('./src/cron/cleanup');
const db = require('./src/database');
const InitContext = require('./src/contexts/InitContext');
const ListContext = require('./src/contexts/ListContext');
const AdminContext = require('./src/contexts/AdminContext');

let bot = new Telegraf(process.env.BOT_TOKEN, { username: process.env.BOT_USERNAME });
const i18n = new TelegrafI18n({
  defaultLanguage: 'en',
  defaultLanguageOnMissing: true,
  directory: path.resolve(__dirname, 'lang'),
});
bot.use(i18n.middleware());

if (process.env.LIMIT_MS && process.env.LIMIT_MESSAGES) {
  bot.use(rateLimit({
    window: process.env.LIMIT_MS,
    limit: process.env.LIMIT_MESSAGES,
    keyGenerator: (ctx) => applyRateLimit(ctx),
    onLimitExceeded: (ctx, next) => {
      if (ctx.chat.type === 'private') {
        ctx.reply(ctx.i18n.t('ratelimit'));
      } else {
        next();
      }
    },
  }));
}
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
  process.stdout.write('Server running in webhook mode\n');
} else {
  bot.startPolling();
  process.stdout.write('Server running in polling mode\n');
}

if (process.env.CRON_CLEANUP) {
  cron.schedule(process.env.CRON_CLEANUP, () => cronCleanup(db), null);
  process.stdout.write('Database will auto-clean\n');
}
