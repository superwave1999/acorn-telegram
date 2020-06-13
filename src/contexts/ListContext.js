const ListView = require('../views/ListView');
const ListUser = require('../database/models/listuser');

class ListContext {
  constructor(bot, db) {
    this.__DEFAULT_MAX_USERS = 50;
    this.__STATE_ISLAND = 0;
    this.__STATE_PRICE = 1;
    this.__STATE_READY = 2;
    this.__STATE_MAX_USERS = 3;
    this.__STR_LANG = 'en';
    this.db = db;
    bot.command('get', (ctx) => {
      this.contextCommon(ctx) && this.baseCommand(ctx);
    });
    bot.action('add_users', (ctx) => {
      this.contextCommon(ctx) && this.actionAddUser(ctx);
    });
    bot.action('complete_user', (ctx) => {
      this.contextCommon(ctx) && this.actionComplete(ctx);
    });
    bot.action('delete_list', (ctx) => {
      this.contextCommon(ctx) && this.actionDelete(ctx);
    });
    return bot;
  }

  /**
   * Technically middleware. Creation must be done in private.
   */
  contextCommon(ctx) {
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      return true;
    }
    ctx.reply('This command is used in groups!');
    return false;
  }

  /**
   * Print the latest listing in a group.
   * @param ctx
   */
  baseCommand(ctx) {
    const query = {
      where: {
        creatorId: ctx.from.id,
        state: 2, // STATE_READY
        isClosed: false,
        publicChatId: null,
      },
      include: [this.db.ListUser],
      order: [['createdAt', 'DESC']],
    };
    this.db.List.findOne(query).then((q) => {
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
    switch (q.state) {
      case this.__STATE_ISLAND:
        toReturn = ctx.reply('Creation menu.\n(1/3) Send me the name of your island!');
        break;
      case this.__STATE_PRICE:
        toReturn = ctx.reply('(2/3) Now, please give me the price.');
        break;
      case this.__STATE_READY || this.__STATE_MAX_USERS:
        const nextStep = '(3/3) If finished, forward this message to a group!\nYou can also configure additional settings:';
        const markup = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `User limit (current: ${q.maxUsers})`,
                  callback_data: 'set_max_users',
                },
              ],
              [{ text: 'Preview', callback_data: 'preview_creation' }],
              [{ text: 'Cancel', callback_data: 'cancel_creation' }],
            ],
          },
        };
        toReturn = ctx.reply(nextStep, markup);
        break;
      case this.__STATE_MAX_USERS:
        toReturn = ctx.reply('Give me the user limit (inclusive).');
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
      case this.__STATE_ISLAND:
        q.island = expectedMessage;
        q.state = this.__STATE_PRICE;
        q.save().then((q2) => {
          this.sendStateMessage(q2, ctx);
        });
        break;
      case this.__STATE_PRICE:
        if (/^\d+$/.test(expectedMessage)) {
          q.price = expectedMessage;
          q.state = this.__STATE_READY;
          q.save().then((q2) => {
            this.sendStateMessage(q2, ctx).then((ctx) => {
              q.privateMessageId = ctx.message_id;
              q.save();
            });
          });
        } else {
          ctx.reply('Please provide a number');
        }
        break;
      case this.__STATE_MAX_USERS:
        if (/^\d+$/.test(expectedMessage)) {
          q.maxUsers = expectedMessage;
          q.state = this.__STATE_READY;
          q.save().then((q2) => {
            this.sendStateMessage(q2, ctx);
          });
        } else {
          ctx.reply('Please provide a number');
        }
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
        q.state = this.__STATE_MAX_USERS;
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
        q.destroy().then((q) => {
          ctx.reply('Cancelled!');
        });
      } else {
        ctx.reply('Nothing to cancel!');
      }
    });
  }
}

module.exports = ListContext;
