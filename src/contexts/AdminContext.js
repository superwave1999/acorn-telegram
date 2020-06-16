const TelegrafInlineMenu = require('telegraf-inline-menu');
const ListView = require('../views/ListView');
const AdminView = require('../views/AdminView');
const GeneralRepository = require('../database/queries/list');

const idParser = require('../helpers/idParser');
const urlParser = require('../helpers/urlParser');

class AdminContext {
  constructor(bot, db) {
    this.listQueries = new GeneralRepository(db);
    bot.action('manage_list', (ctx) => this.contextCommon(ctx) && this.loadMenu(ctx));
    bot.action(/^manage_lock/, (ctx) => this.actionMenuLock(ctx));
    bot.action('manage_users', (ctx) => this.contextCommon(ctx) && this.userMenu(ctx));
    // TODO: Send changes to original message in group.
    return bot;
  }

  /**
   * Load admin menu. Sends it to private chat.
   * @param ctx
   * @returns {Promise<void>}
   */
  async loadMenu(ctx) {
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const list = await this.listQueries.getSingleFromChat(chatId, messageId, true, true);
    if (list !== null) {
      try {
        new AdminView(list).send(ctx, true, false);
      } catch (e) {
        // Ignore...
      }
    }
  }

  /**
   * User keyboard
   * @param ctx
   * @returns {Promise<void>}
   */
  async userMenu(ctx) {
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId, true, true);
    if (list !== null) {
      try {
        // TODO: Not working + update original on user remove.
        new AdminView(list).sendUserList(ctx, true);
      } catch (e) {
        // Ignore...
      }
    }
  }

  /**
   * Technically middleware. Creation must be done in private.
   */
  contextCommon(ctx) {
    return true;
  }

  /**
   * Management menu. Lock or unlock the list.
   * @param ctx
   * @returns {Promise<void>}
   */
  async actionMenuLock(ctx) {
    const listId = idParser(ctx.update.callback_query.message.text);
    const setClosed = parseInt(urlParser(ctx.update.callback_query.data, 'state') || '1', 10);
    const list = await this.listQueries.getSingleFromId(listId, true, true);
    if (list !== null) {
      list.isClosed = setClosed;
      await list.save();
      try {
        new AdminView(list).send(ctx, true, true);
        // TODO: Update original below.
        new ListView(list).send(ctx, true); // TODO: Use group and message id instead.
      } catch (e) {
        // Ignore...
      }
    }
  }
}

module.exports = AdminContext;
