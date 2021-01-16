const AdminView = require('../views/AdminView');
const ListView = require('../views/ListView');
const GeneralRepository = require('../database/queries/list');
const NotificationView = require('../views/NotificationView');
const toType = require('../helpers/toType');
const idParser = require('../helpers/idParser');
const urlParser = require('../helpers/urlParser');

class AdminContext {
  constructor(bot, db) {
    this.listQueries = new GeneralRepository(db);
    bot.action('manage_list', (ctx) => this.loadMenu(ctx));
    bot.action('refresh_list', (ctx) => this.loadMenuRefresh(ctx));
    bot.action('manage_users', (ctx) => this.userMenu(ctx));
    bot.action('set_language', (ctx) => this.setLanguage(ctx));
    bot.action('remove_associate', (ctx) => this.actionRemoveAssociate(ctx));
    bot.action(/^manage_lock/, (ctx) => this.actionMenuLock(ctx));
    bot.action(/^manage_complete/, (ctx) => this.actionCompleteUser(ctx));
    bot.action(/^manage_leave/, (ctx) => this.actionLeaveUser(ctx));
    return bot;
  }

  /**
   * Check if user can administrate the list.
   * @param ctx
   * @param list
   */
  async getAdminUsers(ctx, list) {
    const userId = ctx.from.id;
    const arr = [list.creatorId, list.associateId];
    let isAdmin = (arr.indexOf(userId) !== -1);
    if (!isAdmin && toType(process.env.ADMIN_OPTIONS, false)) {
      isAdmin = (await ctx.telegram.getChatMember(list.publicChatId, userId).status === ('creator' || 'administrator'));
    }
    return isAdmin;
  }

  /**
   * Load admin menu. Sends it to private chat. Can also accept update parameter.
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async loadMenu(ctx) {
    const response = [];
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const list = await this.listQueries.getSingleFromChat(chatId, messageId);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      ctx.i18n.locale(list.language);
      try {
        response.push(await new AdminView(ctx, list).send(true));
      } catch (e) {
        // Ignore...
      }
      response.push(ctx.answerCbQuery().catch(() => {}));
    } else {
      response.push(await ctx.answerCbQuery(ctx.i18n.t('nopermission'), true).catch(() => {}));
    }
    return Promise.all(response);
  }

  /**
   * Refresh admin menu.
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async loadMenuRefresh(ctx) {
    const response = [];
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      ctx.i18n.locale(list.language);
      try {
        response.push(new AdminView(ctx, list).send(true, true));
      } catch (e) {
        // Ignore...
      }
      response.push(ctx.answerCbQuery().catch(() => {}));
    } else {
      response.push(ctx.deleteMessage(ctx.update.callback_query.message.message_id));
      response.push(ctx.answerCbQuery(ctx.i18n.t('nopermission'), true).catch(() => {}));
    }
    return Promise.all(response);
  }

  /**
   * User keyboard
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async userMenu(ctx) {
    const response = [];
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      ctx.i18n.locale(list.language);
      try {
        response.push(new AdminView(ctx, list).sendUserList(true));
      } catch (e) {
        // Ignore...
      }
      response.push(ctx.answerCbQuery().catch(() => {}));
    } else {
      response.push(ctx.deleteMessage(ctx.update.callback_query.message.message_id));
      response.push(ctx.answerCbQuery(ctx.i18n.t('nopermission'), true).catch(() => {}));
    }
    return Promise.all(response);
  }

  /**
   * Set language
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async setLanguage(ctx) {
    const response = [];
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      list.language = ctx.from.language_code;
      await list.save();
      ctx.i18n.locale(list.language);
      try {
        response.push(new AdminView(ctx, list).send(true, true));
        response.push(new ListView(ctx, list, true).send(true));
      } catch (e) {
        // Ignore...
      }
      response.push(ctx.answerCbQuery().catch(() => {}));
    } else {
      response.push(ctx.deleteMessage(ctx.update.callback_query.message.message_id));
      response.push(ctx.answerCbQuery(ctx.i18n.t('nopermission'), true).catch(() => {}));
    }
    return Promise.all(response);
  }

  /**
   * Remove associate.
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async actionRemoveAssociate(ctx) {
    const response = [];
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      list.associateId = null;
      await list.save();
      ctx.i18n.locale(list.language);
      try {
        response.push(new AdminView(ctx, list).send(true, true));
        response.push(new ListView(ctx, list, true).send(true));
      } catch (e) {
        // Ignore...
      }
      response.push(ctx.answerCbQuery().catch(() => {}));
    } else {
      response.push(ctx.deleteMessage(ctx.update.callback_query.message.message_id));
      response.push(ctx.answerCbQuery(ctx.i18n.t('nopermission'), true).catch(() => {}));
    }
    return Promise.all(response);
  }

  /**
   * Management menu. Lock or unlock the list.
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async actionMenuLock(ctx) {
    const response = [];
    const listId = idParser(ctx.update.callback_query.message.text);
    const setClosed = parseInt(urlParser(ctx.update.callback_query.data, 'state') || '1', 10);
    const list = await this.listQueries.getSingleFromId(listId);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      list.isClosed = setClosed;
      await list.save();
      ctx.i18n.locale(list.language);
      try {
        response.push(new AdminView(ctx, list).send(true, true));
        response.push(new ListView(ctx, list, true).send(true));
      } catch (e) {
        // Ignore...
      }
      response.push(ctx.answerCbQuery().catch(() => {}));
    } else {
      response.push(ctx.deleteMessage(ctx.update.callback_query.message.message_id));
      response.push(ctx.answerCbQuery(ctx.i18n.t('nopermission'), true).catch(() => {}));
    }
    return Promise.all(response);
  }

  /**
   * Mark user as complete.
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async actionCompleteUser(ctx) {
    const response = [];
    const listId = idParser(ctx.update.callback_query.message.text);
    const userId = parseInt(urlParser(ctx.update.callback_query.data, 'forceId'), 10);
    const list = await this.listQueries.getSingleFromId(listId);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      const index = list.ListUsers.findIndex((value) => value.userId === userId);
      if (index >= 0) {
        list.ListUsers[index].state = 1; // Mark complete
        await list.ListUsers[index].save(); // Async save in database
        ctx.i18n.locale(list.language);
        try {
          response.push(new AdminView(ctx, list).sendUserList(true));
          response.push(new ListView(ctx, list, true).send(true));
          response.push(new NotificationView(ctx, list).send());
        } catch (e) {
          // Ignore...
        }
      }
      response.push(ctx.answerCbQuery().catch(() => {}));
    } else {
      response.push(ctx.deleteMessage(ctx.update.callback_query.message.message_id));
      response.push(ctx.answerCbQuery(ctx.i18n.t('nopermission'), true).catch(() => {}));
    }
    return Promise.all(response);
  }

  /**
   * Mark user as complete.
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async actionLeaveUser(ctx) {
    const response = [];
    const listId = idParser(ctx.update.callback_query.message.text);
    const userId = parseInt(urlParser(ctx.update.callback_query.data, 'forceId'), 10);
    const list = await this.listQueries.getSingleFromId(listId);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      const index = list.ListUsers.findIndex((value) => value.userId === userId);
      if (index >= 0) {
        list.ListUsers[index].state = -1; // Mark leave
        await list.ListUsers[index].save(); // Async save in database
        ctx.i18n.locale(list.language);
        try {
          response.push(new AdminView(ctx, list).sendUserList(true));
          response.push(new ListView(ctx, list, true).send(true));
          response.push(new NotificationView(ctx, list).send());
        } catch (e) {
          // Ignore...
        }
      }
      response.push(ctx.answerCbQuery().catch(() => {}));
    } else {
      response.push(ctx.deleteMessage(ctx.update.callback_query.message.message_id));
      response.push(ctx.answerCbQuery(ctx.i18n.t('nopermission'), true).catch(() => {}));
    }
    return Promise.all(response);
  }
}

module.exports = AdminContext;
