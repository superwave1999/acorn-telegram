process.stdout.write('Server starting\n');
require('dotenv').config();

process.stdout.write('Config loaded\n');
const Telegraf = require('telegraf');
const db = require('./src/database');
const InitContext = require('./src/contexts/InitContext');
const CreationContext = require('./src/contexts/CreationContext');
const ListContext = require('./src/contexts/ListContext');

let bot = new Telegraf(process.env.BOT_TOKEN, { username: process.env.BOT_USERNAME });
bot = new InitContext(bot);
bot = new CreationContext(bot, db);
bot = new ListContext(bot, db);
bot.launch();
process.stdout.write('Server running\n');
