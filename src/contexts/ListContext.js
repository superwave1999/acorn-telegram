const ListView = require('../views/ListView');
const GeneralRepository = require('../database/queries/list');
const CreationRepository = require('../database/queries/creation');

class ListContext {
  constructor(bot, db) {
    this.conversionQueries = new CreationRepository(db);
    this.listQueries = new GeneralRepository(db);
    bot.mention(bot.options.username, (ctx) => {
      if (ctx.message.text === `@${bot.options.username} get` && this.contextCommon(ctx)) {
        this.baseCommand(ctx);
      }
    });
    bot.action('add_user', (ctx) => this.contextCommon(ctx) && this.actionAddUser(ctx));
    bot.action('complete_user', (ctx) => this.contextCommon(ctx) && this.actionCompleteUser(ctx));
    return bot;
  }

  /**
   * Technically middleware. Creation must be done in private.
   */
  contextCommon(ctx) {
    return (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup');
  }

  /**
   * Print the created listing in a group.
   * @param ctx
   */
  async baseCommand(ctx) {
    try {
      ctx.deleteMessage(ctx.message.message_id);
    } catch (e) {
      // Not admin of group
    }
    const list = await this.conversionQueries.getSingleFromUserId(ctx.from.id);
    if (list !== null) {
      const message = await new ListView(list).send(ctx);
      if (message) {
        list.publicChatId = message.chat.id;
        list.publicMessageId = message.message_id;
        list.save();
      }
    }
  }

  /**
   * Add user to list. Only if list exists and not already on.
   * @param ctx
   * @returns {Promise<void>}
   */
  async actionAddUser(ctx) {
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const list = await this.listQueries.getSingleFromChat(chatId, messageId, true, false);
    if (list !== null) {
      const alreadyAdded = list.ListUsers.some((value) => value.userId === ctx.from.id);
      list.countUsers += 1; // Increments possible count
      if (!alreadyAdded && list.countUsers <= list.maxUsers && !list.isClosed) {
        const created = await this.listQueries.createUser(list.id, ctx.from);
        if (created) {
          list.save(); // Save new user count
          list.ListUsers.push(created);
          new ListView(list).send(ctx, true);
        }
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
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const list = await this.listQueries.getSingleFromChat(chatId, messageId, true, false);
    if (list !== null && !list.isClosed) {
      const index = list.ListUsers.findIndex((value) => value.userId === userId);
      if (index >= 0) {
        list.ListUsers[index].finished = true; // Mark complete
        list.ListUsers[index].save(); // Async save in database
        list.ListUsers.splice(index, 1); // Remove from list
        try {
          new ListView(list).send(ctx, true);
        } catch (e) {
          // Ignore...
        }
      }
    }
  }
}

module.exports = ListContext;
