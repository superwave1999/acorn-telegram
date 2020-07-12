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
    bot.action('set_language', (ctx) => this.setLanguage(ctx));
    bot.action('remove_associate', (ctx) => this.actionRemoveAssociate(ctx));
    bot.action(/^manage_lock/, (ctx) => this.actionMenuLock(ctx));
    bot.action(/^manage_complete/, (ctx) => this.actionCompleteUser(ctx));
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
    if (!isAdmin && process.env.ADMIN_OPTIONS) {
      isAdmin = (await ctx.telegram.getChatMember(list.publicChatId, userId).status === ('creator' || 'administrator'));
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
    const list = await this.listQueries.getSingleFromChat(chatId, messageId, true, true, false);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      ctx.i18n.locale(list.language);
      try {
        await new AdminView(ctx, list).send(true);
      } catch (e) {
        // Ignore...
      }
      await ctx.answerCbQuery();
    } else {
      await ctx.answerCbQuery(ctx.i18n.t('nopermission'), true);
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
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      ctx.i18n.locale(list.language);
      try {
        await new AdminView(ctx, list).send(true, true);
      } catch (e) {
        // Ignore...
      }
      await ctx.answerCbQuery();
    } else {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.answerCbQuery(ctx.i18n.t('nopermission'), true);
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
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      ctx.i18n.locale(list.language);
      try {
        await new AdminView(ctx, list).sendUserList(true);
      } catch (e) {
        // Ignore...
      }
      await ctx.answerCbQuery();
    } else {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.answerCbQuery(ctx.i18n.t('nopermission'), true);
    }
  }

  /**
   * Set language
   * @param ctx
   * @returns {Promise<void>}
   */
  async setLanguage(ctx) {
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId, true, true);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      list.language = ctx.from.language_code;
      await list.save();
      ctx.i18n.locale(list.language);
      try {
        await new AdminView(ctx, list).send(true, true);
        await new ListView(ctx, list, true).send(true);
      } catch (e) {
        // Ignore...
      }
      await ctx.answerCbQuery();
    } else {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.answerCbQuery(ctx.i18n.t('nopermission'), true);
    }
  }

  /**
   * Remove associate.
   * @param ctx
   * @returns {Promise<void>}
   */
  async actionRemoveAssociate(ctx) {
    const listId = idParser(ctx.update.callback_query.message.text);
    const list = await this.listQueries.getSingleFromId(listId, true, true);
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      list.associateId = null;
      await list.save();
      ctx.i18n.locale(list.language);
      try {
        await new AdminView(ctx, list).send(true, true);
        await new ListView(ctx, list, true).send(true);
      } catch (e) {
        // Ignore...
      }
      await ctx.answerCbQuery();
    } else {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.answerCbQuery(ctx.i18n.t('nopermission'), true);
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
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      list.isClosed = setClosed;
      await list.save();
      ctx.i18n.locale(list.language);
      try {
        await new AdminView(ctx, list).send(true, true);
        await new ListView(ctx, list, true).send(true);
      } catch (e) {
        // Ignore...
      }
      await ctx.answerCbQuery();
    } else {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.answerCbQuery(ctx.i18n.t('nopermission'), true);
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
    if (list !== null && await this.getAdminUsers(ctx, list)) {
      const index = list.ListUsers.findIndex((value) => value.userId === userId);
      if (index >= 0) {
        list.ListUsers[index].finished = true; // Mark complete
        await list.ListUsers[index].save(); // Async save in database
        ctx.i18n.locale(list.language);
        try {
          await new AdminView(ctx, list).sendUserList(true);
          await new ListView(ctx, list, true).send(true);
          await new NotificationView(ctx, list).send();
        } catch (e) {
          // Ignore...
        }
      }
      await ctx.answerCbQuery();
    } else {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.answerCbQuery(ctx.i18n.t('nopermission'), true);
    }
  }
}

module.exports = AdminContext;
