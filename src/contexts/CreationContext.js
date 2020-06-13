const Preview = require('../views/ListView');

class CreationContext {
  constructor(bot, db) {
    this.DEFAULT_MAX_USERS = 50;
    this.STATE_ISLAND = 0;
    this.STATE_PRICE = 1;
    this.STATE_READY = 2;
    this.STATE_MAX_USERS = 3;
    this.STR_LANG = 'en';
    this.db = db;
    bot.command('create', (ctx) => this.contextCommon(ctx) && this.baseCommand(ctx));
    bot.action('set_max_users', (ctx) => this.contextCommon(ctx) && this.actionSetMaxUsers(ctx));
    bot.action('preview_creation', (ctx) => this.contextCommon(ctx) && this.actionPreview(ctx));
    bot.action('cancel_creation', (ctx) => this.contextCommon(ctx) && this.actionCancel(ctx));
    bot.on('text', (ctx) => this.contextCommon(ctx) && this.messageHandler(ctx));
    return bot;
  }

  /**
   * Technically middleware. Creation must be done in private.
   */
  contextCommon(ctx) {
    if (ctx.chat.type === 'private') {
      return true;
    }
    ctx.reply('Talk to me in private!');
    return false;
  }

  /**
   * Get the currently active listing.
   */
  getQuery(where = {}, include = null) {
    where.isClosed = false;
    where.publicChatId = null;
    const query = {
      where,
      order: [['createdAt', 'DESC']],
    };
    if (include) {
      query.include = include;
    }
    return this.db.List.findOne(query);
  }

  /**
   * Command that starts this context.
   * @param ctx
   */
  baseCommand(ctx) {
    const insert = {
      creatorId: ctx.from.id,
      language: ctx.from.language_code,
      state: this.STATE_ISLAND,
      maxUsers: this.DEFAULT_MAX_USERS,
      isClosed: false,
      publicChatId: null,
    };
    this.db.List.findOrCreate({ where: insert }).then((q) => {
      if (q !== null) {
        this.sendStateMessage(q[0], ctx);
      }
    });
  }

  /**
   * Handles written messages.
   * @param ctx
   */
  messageHandler(ctx) {
    // User and chat match if private convo
    const where = {
      creatorId: ctx.from.id,
    };
    this.getQuery(where).then((q) => {
      if (q == null) {
        ctx.reply('Execute /create first!');
      } else {
        this.handleMessageState(q, ctx);
      }
    });
  }

  /**
   * Send message by state type. Returns promise.
   * @param q
   * @param ctx
   * @returns {null}
   */
  sendStateMessage(q, ctx) {
    let toReturn = null;
    let nextStep = null;
    let markup = null;
    switch (q.state) {
      case this.STATE_ISLAND:
        toReturn = ctx.reply('Creation menu.\n(1/3) Send me the name of your island!');
        break;
      case this.STATE_PRICE:
        toReturn = ctx.reply('(2/3) Now, please give me the price.');
        break;
      case this.STATE_READY || this.STATE_MAX_USERS:
        nextStep = '(3/3) If finished, run /get in a group!\nYou can also configure additional settings:';
        markup = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: `User limit (current: ${q.maxUsers})`, callback_data: 'set_max_users' },
              ],
              [
                { text: 'Preview', callback_data: 'preview_creation' },
              ],
              [
                { text: 'Cancel', callback_data: 'cancel_creation' },
              ],
            ],
          },
        };
        toReturn = ctx.reply(nextStep, markup);
        break;
      case this.STATE_MAX_USERS:
        toReturn = ctx.reply('Give me the user limit (inclusive).');
        break;
      default:
        break;
    }
    return toReturn;
  }

  /**
   * Read message and store depending on status.
   * @param q
   * @param ctx
   */
  handleMessageState(q, ctx) {
    const expectedMessage = ctx.message.text;
    switch (q.state) {
      case this.STATE_ISLAND:
        q.island = expectedMessage;
        q.state = this.STATE_PRICE;
        q.save().then((q2) => {
          this.sendStateMessage(q2, ctx);
        });
        break;
      case this.STATE_PRICE:
        if (/^\d+$/.test(expectedMessage)) {
          q.price = expectedMessage;
          q.state = this.STATE_READY;
          q.save().then((q2) => {
            this.sendStateMessage(q2, ctx).then((ctx2) => {
              q.privateMessageId = ctx2.message_id;
              q.save();
            });
          });
        } else {
          ctx.reply('Please provide a number');
        }
        break;
      case this.STATE_MAX_USERS:
        if (/^\d+$/.test(expectedMessage)) {
          q.maxUsers = expectedMessage;
          q.state = this.STATE_READY;
          q.save().then((q2) => {
            this.sendStateMessage(q2, ctx);
          });
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
  actionSetMaxUsers(ctx) {
    const where = {
      creatorId: ctx.from.id,
    };
    this.getQuery(where).then((q) => {
      if (q == null) {
        ctx.reply('Execute /create first!');
      } else {
        q.state = this.STATE_MAX_USERS;
        q.save().then((q2) => {
          this.sendStateMessage(q2, ctx);
        });
      }
    });
  }

  /**
   * Preview the final message.
   * @param ctx
   */
  actionPreview(ctx) {
    const where = {
      creatorId: ctx.from.id,
    };
    const include = [this.db.ListUser];
    this.getQuery(where, include).then((q) => {
      if (q == null) {
        ctx.reply('Execute /create first!');
      } else {
        const message = new Preview(q).render();
        ctx.replyWithMarkdown(message);
      }
    });
  }

  /**
   * Cancel the creation process.
   * @param ctx
   */
  actionCancel(ctx) {
    const where = {
      creatorId: ctx.from.id,
    };
    this.getQuery(where).then((q) => {
      if (q !== null) {
        q.destroy().then(() => {
          ctx.reply('Cancelled!');
        });
      } else {
        ctx.reply('Nothing to cancel!');
      }
    });
  }
}

module.exports = CreationContext;
