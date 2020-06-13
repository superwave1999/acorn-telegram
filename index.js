process.stdout.write('Server starting');
require('dotenv').config();

process.stdout.write('Config loaded');
const Telegraf = require('telegraf');
const db = require('./src/database');
const InitContext = require('./src/contexts/InitContext');
const CreationContext = require('./src/contexts/CreationContext');
const ListContext = require('./src/contexts/ListContext');

let bot = new Telegraf(process.env.BOT_TOKEN);
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
  process.stdout.write('Telegram connected');
}, () => {
  process.stdout.write('Telegram connection error');
  process.exit(1);
});
/*
bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log('Response time: %sms', ms)
})
 */
bot = new InitContext(bot);
bot = new CreationContext(bot, db);
bot = new ListContext(bot, db);
bot.launch();
process.stdout.write('Server running');
