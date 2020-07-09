const Preview = require('../views/PreviewView');
const CreationRepository = require('../database/queries/creation');
const ListView = require('../views/ListView');
const NotificationView = require('../views/NotificationView');
const GeneralRepository = require('../database/queries/list');

class ListContext {
  constructor(bot, db) {
    this.listQueries = new GeneralRepository(db);
    this.queries = new CreationRepository(db);
    this.STATE_ISLAND = 0;
    this.STATE_PRICE = 1;
    this.STATE_READY = 2;
    this.STATE_MAX_USERS = 3;
    this.STATE_SET_NOTIFICATION = 4;
    this.USERNAME = bot.options.username;
    // Creation
    bot.command('create', (ctx) => this.baseCommand(ctx));
    bot.action('set_max_users', (ctx) => this.actionSetMaxUsers(ctx));
    bot.action('set_notification', (ctx) => this.actionSetNotification(ctx));
    bot.action('cancel_creation', (ctx) => this.actionCancel(ctx));
    // Listing
    bot.action('add_user', (ctx) => this.actionAddUser(ctx));
    bot.action('complete_user', (ctx) => this.actionCompleteUser(ctx));
    // Both
    bot.on('text', (ctx) => this.messageHandler(ctx));
    return bot;
  }

  /**
   * Handles written messages.
   * @param ctx
   */
  async messageHandler(ctx) {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      if (ctx.message.text === `@${this.USERNAME} get`) {
        await this.convertCommand(ctx);
      } else {
        // TODO: no-op
      }
    } else {
      const list = await this.queries.getSingleFromUserId(ctx.from.id);
      if (list == null) {
        ctx.reply('Execute /create first!');
      } else {
        await this.handleMessageState(list, ctx);
      }
    }
  }

  /**
   * Create listing command.
   * @param ctx
   */
  async baseCommand(ctx) {
    if (ctx.chat.type === 'private') {
      const created = await this.queries.createList(ctx.from);
      if (created.length > 0) {
        this.sendStateMessage(created[0], ctx);
      }
    }
  }

  /**
   * Send message by state type. Returns promise.
   * @param q
   * @param ctx
   * @returns {null}
   */
  sendStateMessage(q, ctx) {
    switch (q.state) {
      case this.STATE_ISLAND:
        ctx.reply('Creation menu.\n(1/3) Send me the name of your island!');
        break;
      case this.STATE_PRICE:
        ctx.reply('(2/3) Now, please give me the price.');
        break;
      case this.STATE_READY || this.STATE_MAX_USERS:
        new Preview(q).sendPreview(ctx);
        break;
      case this.STATE_MAX_USERS:
        ctx.reply('Give me the user limit (inclusive).');
        break;
      case this.STATE_SET_NOTIFICATION:
        ctx.reply('Give me the notification threshold\n(eg: 4 - The fourth user will get a private notification).\n 0 to disable.');
        break;
      default:
        break;
    }
  }

  /**
   * Read message and store depending on status.
   * @param q
   * @param ctx
   */
  async handleMessageState(q, ctx) {
    const expectedMessage = ctx.message.text;
    let q2 = null;
    switch (q.state) {
      case this.STATE_ISLAND:
        if (expectedMessage.length < 255) {
          q.island = expectedMessage;
          q.state = this.STATE_PRICE;
          q2 = await q.save();
          this.sendStateMessage(q2, ctx);
        } else {
          ctx.reply('Island name too long!');
        }
        break;
      case this.STATE_PRICE:
        if (/^\d+$/.test(expectedMessage) && Number(expectedMessage) <= Number(process.env.MAX_PRICE || 800)) {
          q.price = expectedMessage;
          q.state = this.STATE_READY;
          q2 = await q.save();
          this.sendStateMessage(q2, ctx);
        } else {
          ctx.reply('Please provide a valid number!');
        }
        break;
      case this.STATE_MAX_USERS:
      case this.STATE_SET_NOTIFICATION:
        if (/^\d+$/.test(expectedMessage) && Number(expectedMessage) <= Number(process.env.MAX_LIST_USERS || 100)) {
          q.maxUsers = expectedMessage;
          q.state = this.STATE_READY;
          q2 = await q.save();
          this.sendStateMessage(q2, ctx);
        } else {
          ctx.reply('Please provide a number!');
        }
        break;
      default:
        break;
    }
  }

  /**
   * Set table row as expecting max user.
   * @param ctx
   */
  async actionSetMaxUsers(ctx) {
    let list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list == null) {
      ctx.reply('Execute /create first!');
    } else {
      list.state = this.STATE_MAX_USERS;
      list = await list.save();
      this.sendStateMessage(list, ctx);
    }
  }

  /**
   * Set table row as expecting notification threshold.
   * @param ctx
   */
  async actionSetNotification(ctx) {
    let list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list == null) {
      ctx.reply('Execute /create first!');
    } else {
      list.state = this.STATE_SET_NOTIFICATION;
      list = await list.save();
      this.sendStateMessage(list, ctx);
    }
  }

  /**
   * Cancel the creation process.
   * @param ctx
   */
  async actionCancel(ctx) {
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list !== null) {
      await list.destroy();
      ctx.reply('Cancelled!');
    } else {
      ctx.reply('Nothing to cancel!');
    }
  }

  /**
   * Print the created listing in a group.
   * @param ctx
   */
  async convertCommand(ctx) {
    try {
      await ctx.deleteMessage(ctx.message.message_id);
    } catch (e) {
      // Not admin of group
    }
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
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
          await new ListView(list).send(ctx, true);
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
          await new ListView(list).send(ctx, true);
          await new NotificationView(list).send(ctx);
        } catch (e) {
          // Ignore...
        }
      }
    }
  }
}

module.exports = ListContext;
