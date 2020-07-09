const AdminView = require('../views/AdminView');
const ListView = require('../views/ListView');
const GeneralRepository = require('../database/queries/list');
const NotificationView = require('../views/NotificationView');

const idParser = require('../helpers/idParser');
const urlParser = require('../helpers/urlParser');

class AdminContext {
  constructor(bot, db) {
    this.listQueries = new GeneralRepository(db);
    bot.action('manage_list', (ctx) => this.loadMenu(ctx));
    bot.action('refresh_list', (ctx) => this.loadMenuRefresh(ctx));
    bot.action('manage_users', (ctx) => this.userMenu(ctx));
    bot.action(/^manage_lock/, (ctx) => this.actionMenuLock(ctx));
    bot.action(/^manage_complete/, (ctx) => this.actionCompleteUser(ctx));
    return bot;
  }

  /**
   * Check if user can administrate the list.
   * @param ctx
   */
  async getAdminUsers(ctx, list) {
    const userId = ctx.from.id;
    const arr = [list.creatorId, list.associateId];
    let isAdmin = (arr.indexOf(userId) !== -1);
    if (!isAdmin) {
      isAdmin = (await ctx.from.getChatMember(userId).status === ('creator' || 'administrator'));
    }
    return isAdmin;
  }

  /**
   * Load admin menu. Sends it to private chat. Can also accept update parameter.
   * @param ctx
   * @returns {Promise<void>}
   */
  async loadMenu(ctx) {
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const list = await this.listQueries.getSingleFromChat(chatId, messageId, true, true);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      try {
        await new AdminView(list).send(ctx, true);
      } catch (e) {
        // Ignore...
      }
    }
  }

  /**
   * Refresh admin menu.
   * @param ctx
   * @returns {Promise<void>}
   */
  async loadMenuRefresh(ctx) {
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId, true, true);
    if (list !== null) {
      try {
        await new AdminView(list).send(ctx, true, true);
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
        new AdminView(list).sendUserList(ctx, true);
      } catch (e) {
        // Ignore...
      }
    }
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
        await new AdminView(list).send(ctx, true, true);
        await new ListView(list, true).send(ctx, true);
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
          await new AdminView(list).sendUserList(ctx, true);
          await new ListView(list, true).send(ctx, true);
          await new NotificationView(list).send(ctx);
        } catch (e) {
          // Ignore...
        }
      }
    }
  }
}

module.exports = AdminContext;
