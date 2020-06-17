const TelegrafInlineMenu = require('telegraf-inline-menu');
const AdminView = require('../views/AdminView');
const GeneralRepository = require('../database/queries/list');

const idParser = require('../helpers/idParser');
const urlParser = require('../helpers/urlParser');

class AdminContext {
  constructor(bot, db) {
    this.listQueries = new GeneralRepository(db);
    bot.action('manage_list', (ctx) => this.contextCommon(ctx) && this.loadMenu(ctx));
    bot.action('refresh_list', (ctx) => this.contextCommon(ctx) && this.loadMenuRefresh(ctx));
    bot.action('manage_users', (ctx) => this.contextCommon(ctx) && this.userMenu(ctx));
    bot.action(/^manage_lock/, (ctx) => this.actionMenuLock(ctx));
    bot.action(/^manage_complete/, (ctx) => this.actionCompleteUser(ctx));
    return bot;
  }

  /**
   * Load admin menu. Sends it to private chat. Can also accept update parameter.
   * @param ctx
   * @returns {Promise<void>}
   */
  async loadMenu(ctx) {
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const update = parseInt(urlParser(ctx.update.callback_query.data, 'update') || '0', 10);
    const list = await this.listQueries.getSingleFromChat(chatId, messageId, true, true);
    if (list !== null) {
      try {
        new AdminView(list).send(ctx, true, update);
      } catch (e) {
        // Ignore...
      }
    }
  }

  /**
   * Load admin menu. Sends it to private chat. Can also accept update parameter.
   * @param ctx
   * @returns {Promise<void>}
   */
  async loadMenuRefresh(ctx) {
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId, true, true);
    if (list !== null) {
      try {
        new AdminView(list).send(ctx, true, true);
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
        // TODO: Update original on user remove.
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
        // new ListView(list).send(ctx, true); // TODO: Use group and message id instead.
      } catch (e) {
        // Ignore...
      }
    }
  }

  /**
   * Mark user as complete.
   * @param ctx
   * @param forceId
   * @returns {Promise<void>}
   */
  async actionCompleteUser(ctx) {
    const listId = idParser(ctx.update.callback_query.message.text);
    const userId = parseInt(urlParser(ctx.update.callback_query.data, 'forceId'), 10);
    const list = await this.listQueries.getSingleFromId(listId, true, true);
    if (list !== null) {
      const index = list.ListUsers.findIndex((value) => value.userId === userId);
      if (index >= 0) {
        list.ListUsers[index].finished = true; // Mark complete
        list.ListUsers[index].save(); // Async save in database
        list.ListUsers.splice(index, 1); // Remove from list
        try {
          new AdminView(list).sendUserList(ctx, true);
        } catch (e) {
          // Ignore...
        }
      }
    }
  }
}

module.exports = AdminContext;
