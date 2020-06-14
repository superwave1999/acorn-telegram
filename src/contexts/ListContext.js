const ListView = require('../views/ListView');

class ListContext {
  constructor(bot, db) {
    this.db = db;
    bot.mention(bot.options.username, (ctx) => {
      if (ctx.message.text === `@${bot.options.username} get` && this.contextCommon(ctx)) {
        this.baseCommand(ctx);
      }
    });
    bot.action('add_user', (ctx) => this.contextCommon(ctx) && this.actionAddUser(ctx));
    bot.action('complete_user', (ctx) => this.contextCommon(ctx) && this.actionCompleteUser(ctx));
    // bot.action('delete_list', (ctx) => this.contextCommon(ctx) && this.actionDelete(ctx));
    return bot;
  }

  /**
   * Technically middleware. Creation must be done in private.
   */
  contextCommon(ctx) {
    return (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup');
  }

  /**
   * Base query for this context.
   */
  async getQuery(where = {}, withUsers = true, onlyQueued = true) {
    where.isClosed = false;
    const query = {
      where,
      order: [['createdAt', 'DESC']],
    };
    if (withUsers) {
      // Only display users that are still in the queue
      const userInclude = { model: this.db.ListUser, order: [['createdAt', 'ASC']] };
      if (onlyQueued) {
        userInclude.where = { finished: false };
      }
      query.include = [userInclude];
    }
    return this.db.List.findOne(query);
  }

  /**
   * Print the created listing in a group.
   * @param ctx
   */
  async baseCommand(ctx) {
    ctx.deleteMessage(ctx.chat.id, ctx.message.message_id);
    const list = await this.getQuery({
      creatorId: ctx.from.id, publicChatId: null, publicMessageId: null,
    });
    if (list !== null) {
      const view = new ListView(list);
      ctx.reply(view.render(), { parse_mode: 'markdown', reply_markup: view.markup() }).then((ctx2) => {
        list.publicChatId = ctx2.chat.id;
        list.publicMessageId = ctx2.message_id;
        list.save();
      });
    }
  }

  /**
   * Add user to list. Only if list exists and not already on.
   * @param ctx
   * @returns {Promise<void>}
   */
  async actionAddUser(ctx) {
    // TODO: User limit control.
    const list = await this.getQuery({
      publicChatId: ctx.chat.id,
      publicMessageId: ctx.update.callback_query.message.message_id,
    }, true, false);
    if (list !== null) {
      const alreadyAdded = list.ListUsers.some((value) => value.userId === ctx.from.id);
      if (!alreadyAdded) {
        const created = await this.db.ListUser.create({
          finished: false,
          username: ctx.from.username,
          userId: ctx.from.id,
          listId: list.id,
        });
        if (created) {
          list.ListUsers.push(created);
          const view = new ListView(list);
          await ctx.editMessageText(view.render(), { parse_mode: 'markdown', reply_markup: view.markup() });
        }
      }
    }
  }

  /**
   * Mark user as complete.
   * @param ctx
   * @returns {Promise<void>}
   */
  async actionCompleteUser(ctx) {
    // TODO: Future checks
    const list = await this.getQuery({
      publicChatId: ctx.chat.id,
      publicMessageId: ctx.update.callback_query.message.message_id,
    }, true, true);
    if (list !== null) {
      const index = list.ListUsers.findIndex((value) => value.userId === ctx.from.id);
      if (index >= 0) {
        list.ListUsers[index].finished = true; // Mark complete
        list.ListUsers[index].save(); // Async save in database
        list.ListUsers.splice(index, 1); // Remove from list
        const view = new ListView(list);
        try {
          ctx.editMessageText(view.render(), { parse_mode: 'markdown', reply_markup: view.markup() });
        } catch (e) {
          process.stdout.write(e.message);
        }
      }
    }
  }
}

module.exports = ListContext;
