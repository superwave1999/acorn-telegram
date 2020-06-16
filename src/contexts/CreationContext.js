const Preview = require('../views/PreviewView');
const CreationRepository = require('../database/queries/creation');

class CreationContext {
  constructor(bot, db) {
    this.queries = new CreationRepository(db);
    this.STATE_ISLAND = 0;
    this.STATE_PRICE = 1;
    this.STATE_READY = 2;
    this.STATE_MAX_USERS = 3;
    this.STATE_SET_NOTIFICATION = 4;
    bot.command('create', (ctx) => this.baseCommand(ctx));
    bot.action('set_max_users', (ctx) => this.actionSetMaxUsers(ctx));
    bot.action('set_notification', (ctx) => this.actionSetNotification(ctx));
    bot.action('cancel_creation', (ctx) => this.actionCancel(ctx));
    // TODO: How to avoid listening to groups
    // bot.on('text', (ctx) => this.messageHandler(ctx));
    return bot;
  }

  /**
   * Command that starts this context.
   * @param ctx
   */
  async baseCommand(ctx) {
    const created = await this.queries.createList(ctx.from);
    if (created.length > 0) {
      this.sendStateMessage(created[0], ctx);
    }
  }

  /**
   * Handles written messages.
   * @param ctx
   */
  async messageHandler(ctx) {
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list == null) {
      ctx.reply('Execute /create first!');
    } else {
      this.handleMessageState(list, ctx);
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
        ctx.reply('Give me the notification threshold\n(eg: 4 - The fourth user will get a private notification).');
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
        q.island = expectedMessage;
        q.state = this.STATE_PRICE;
        q2 = await q.save();
        this.sendStateMessage(q2, ctx);
        break;
      case this.STATE_PRICE:
        if (/^\d+$/.test(expectedMessage)) {
          q.price = expectedMessage;
          q.state = this.STATE_READY;
          q2 = await q.save();
          this.sendStateMessage(q2, ctx);
        } else {
          ctx.reply('Please provide a number');
        }
        break;
      case this.STATE_MAX_USERS:
        if (/^\d+$/.test(expectedMessage)) {
          q.maxUsers = expectedMessage;
          q.state = this.STATE_READY;
          q2 = await q.save();
          this.sendStateMessage(q2, ctx);
        } else {
          ctx.reply('Please provide a number');
        }
        break;
      case this.STATE_SET_NOTIFICATION:
        if (/^\d+$/.test(expectedMessage)) {
          q.notification = expectedMessage;
          q.state = this.STATE_READY;
          q2 = await q.save();
          this.sendStateMessage(q2, ctx);
        } else {
          ctx.reply('Please provide a number');
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
}

module.exports = CreationContext;
