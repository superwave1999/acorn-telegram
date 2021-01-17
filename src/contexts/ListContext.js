const Preview = require('../views/PreviewView');
const CreationRepository = require('../database/queries/creation');
const ListView = require('../views/ListView');
const NotificationView = require('../views/NotificationView');
const GeneralRepository = require('../database/queries/list');
const toType = require('../helpers/toType');

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
    bot.on('contact', (ctx) => this.contactHandler(ctx));
    // Listing
    bot.action('add_user', (ctx) => this.actionAddUser(ctx));
    bot.action('complete_user', (ctx) => this.actionCompleteUser(ctx));
    bot.action('leave_user', (ctx) => this.actionLeaveUser(ctx));
    // Both
    bot.on('text', (ctx) => this.messageHandler(ctx));
    return bot;
  }

  /**
   * Handles written messages.
   * @param ctx
   */
  async messageHandler(ctx) {
    const response = [];
    if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
      if (ctx.message.text === `@${this.USERNAME} get`) {
        response.push(this.convertCommand(ctx));
      }
    } else {
      const list = await this.queries.getSingleFromUserId(ctx.from.id);
      if (list == null) {
        response.push(ctx.reply(ctx.i18n.t('list.err.create')));
      } else {
        response.push(this.handleMessageState(list, ctx));
      }
    }
    return Promise.all(response);
  }

  /**
   * Handles contact shares.
   * @returns {Promise<unknown[]>}
   */
  async contactHandler(ctx) {
    const response = [];
    if (ctx.chat.type === 'private') {
      const list = await this.queries.getSingleFromUserId(ctx.from.id);
      if (list == null) {
        response.push(ctx.reply(ctx.i18n.t('list.err.create')));
      } else {
        list.associateId = ctx.update.message.contact.user_id;
        await list.save();
        response.push(ctx.reply(ctx.i18n.t('list.state.contact', { u: ctx.update.message.contact.first_name }), {
          parse_mode: 'markdown',
        }));
      }
    }
    return Promise.all(response);
  }

  /**
   * Create listing command.
   * @param ctx
   */
  async baseCommand(ctx) {
    const response = [];
    if (ctx.chat.type === 'private') {
      const existing = await this.queries.getSingleFromUserId(ctx.from.id);
      if (existing) {
        await existing.destroy();
      }
      const created = await this.queries.createList(ctx);
      if (created) {
        await created.reload();
        response.push(this.sendStateMessage(created, ctx));
      }
    }
    return Promise.all(response);
  }

  /**
   * Send message by state type. Returns promise.
   * @param q
   * @param ctx
   * @returns {null}
   */
  async sendStateMessage(q, ctx) {
    const response = [];
    ctx.i18n.locale(q.language);
    switch (q.state) {
      case this.STATE_ISLAND:
        response.push(ctx.reply(ctx.i18n.t('list.state.island')));
        break;
      case this.STATE_PRICE:
        response.push(ctx.reply(ctx.i18n.t('list.state.price')));
        break;
      case this.STATE_READY:
        response.push(new Preview(ctx, q).sendPreview());
        break;
      case this.STATE_MAX_USERS:
        response.push(ctx.reply(ctx.i18n.t('list.state.users')));
        break;
      case this.STATE_SET_NOTIFICATION:
        response.push(ctx.reply(ctx.i18n.t('list.state.notification')));
        break;
      default:
        break;
    }
    return Promise.all(response);
  }

  /**
   * Read message and store depending on status.
   * @param q
   * @param ctx
   */
  async handleMessageState(q, ctx) {
    const response = [];
    ctx.i18n.locale(q.language);
    const expectedMessage = ctx.message.text;
    switch (q.state) {
      case this.STATE_ISLAND:
        if (expectedMessage.length < 255) {
          q.island = expectedMessage;
          q.state = this.STATE_PRICE;
          await q.save();
          response.push(this.sendStateMessage(q, ctx));
        } else {
          response.push(ctx.reply(ctx.i18n.t('list.err.island')));
        }
        break;
      case this.STATE_PRICE:
        if (/^\d+$/.test(expectedMessage)) {
          const max = toType(process.env.MAX_PRICE, 800);
          if (Number(expectedMessage) <= max) {
            q.price = expectedMessage;
            q.state = this.STATE_READY;
            await q.save();
            response.push(this.sendStateMessage(q, ctx));
          } else {
            response.push(ctx.reply(ctx.i18n.t('list.err.numbermin', { n: max }), { parse_mode: 'Markdown' }));
          }
        } else {
          response.push(ctx.reply(ctx.i18n.t('list.err.number')));
        }
        break;
      case this.STATE_MAX_USERS:
        if (/^\d+$/.test(expectedMessage)) {
          const max = toType(process.env.MAX_LIST_USERS, 100);
          if (Number(expectedMessage) <= max) {
            q.maxUsers = expectedMessage;
            q.state = this.STATE_READY;
            await q.save();
            response.push(this.sendStateMessage(q, ctx));
          } else {
            response.push(ctx.reply(ctx.i18n.t('list.err.numbermin', { n: max }), { parse_mode: 'Markdown' }));
          }
        } else {
          response.push(ctx.reply(ctx.i18n.t('list.err.number')));
        }
        break;
      case this.STATE_SET_NOTIFICATION:
        if (/^\d+$/.test(expectedMessage)) {
          const max = toType(process.env.MAX_LIST_USERS, 100);
          if (Number(expectedMessage) <= max) {
            q.notification = expectedMessage;
            q.state = this.STATE_READY;
            await q.save();
            response.push(this.sendStateMessage(q, ctx));
          } else {
            response.push(ctx.reply(ctx.i18n.t('list.err.numbermin', { n: max }), { parse_mode: 'Markdown' }));
          }
        } else {
          response.push(ctx.reply(ctx.i18n.t('list.err.number')));
        }
        break;
      default:
        break;
    }
    return Promise.all(response);
  }

  /**
   * Set table row as expecting max user.
   * @param ctx
   */
  async actionSetMaxUsers(ctx) {
    const response = [];
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list == null) {
      response.push(ctx.reply(ctx.i18n.t('list.err.create')));
    } else {
      list.state = this.STATE_MAX_USERS;
      await list.save();
      response.push(this.sendStateMessage(list, ctx));
    }
    response.push(ctx.answerCbQuery().catch(() => {}));
    return Promise.all(response);
  }

  /**
   * Set table row as expecting notification threshold.
   * @param ctx
   */
  async actionSetNotification(ctx) {
    const response = [];
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list == null) {
      response.push(ctx.reply(ctx.i18n.t('list.err.create')));
    } else {
      list.state = this.STATE_SET_NOTIFICATION;
      await list.save();
      response.push(this.sendStateMessage(list, ctx));
    }
    response.push(ctx.answerCbQuery().catch(() => {}));
    return Promise.all(response);
  }

  /**
   * Cancel the creation process.
   * @param ctx
   */
  async actionCancel(ctx) {
    const response = [];
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list !== null) {
      ctx.i18n.locale(list.language);
      await list.destroy();
      response.push(ctx.reply(ctx.i18n.t('list.cancel.main')));
    } else {
      response.push(ctx.reply(ctx.i18n.t('list.cancel.none')));
    }
    response.push(ctx.answerCbQuery().catch(() => {}));
    return Promise.all(response);
  }

  /**
   * Print the created listing in a group.
   * @param ctx
   */
  async convertCommand(ctx) {
    const response = [];
    try {
      response.push(ctx.deleteMessage(ctx.message.message_id).catch(() => {}));
    } catch (e) {
      // Not admin of group
    }
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list !== null) {
      ctx.i18n.locale(list.language);
      const message = await new ListView(ctx, list).send();
      if (message) {
        list.publicChatId = message.chat.id;
        list.publicMessageId = message.message_id;
        await list.save();
      }
    }
    return Promise.all(response);
  }

  /**
   * Add user to list. Only if list exists and not already on.
   * Only allows users with @username. Else notifies via private.
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async actionAddUser(ctx) {
    const response = [];
    if (ctx.from.username && ctx.from.username.length > 0) {
      const chatId = ctx.chat.id;
      const messageId = ctx.update.callback_query.message.message_id;
      const list = await this.listQueries.getSingleFromChat(chatId, messageId);
      if (list !== null) {
        if (!list.isClosed) {
          if (!list.ListUsers.some((value) => value.userId === ctx.from.id)) {
            const countUsers = list.ListUsers.length + 1;
            if (countUsers <= list.maxUsers) {
              const created = await this.listQueries.createUser(list.id, ctx.from);
              if (created) {
                list.ListUsers.push(created);
                ctx.i18n.locale(list.language);
                try {
                  response.push(new ListView(ctx, list).send(true));
                } catch (e) {
                  // Ignore...
                }
                response.push(ctx.answerCbQuery(ctx.i18n.t('alert.msg.list.joined')).catch(() => {}));
              } else {
                response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.create'), true).catch(() => {}));
              }
            } else {
              response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.limit'), true).catch(() => {}));
            }
          } else {
            response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.add'), true).catch(() => {}));
          }
        } else {
          response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.closed'), true).catch(() => {}));
        }
      } else {
        response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.invalid'), true).catch(() => {}));
      }
    } else {
      response.push(ctx.answerCbQuery(ctx.i18n.t('nousername'), true).catch(() => {}));
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
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const list = await this.listQueries.getSingleFromChat(chatId, messageId);
    if (list !== null) {
      if (!list.isClosed) {
        const index = list.ListUsers.findIndex((value) => value.userId === userId);
        if (index >= 0 && list.ListUsers[index].state === 0) {
          list.ListUsers[index].state = 1; // Mark complete
          await list.ListUsers[index].save();
          ctx.i18n.locale(list.language);
          try {
            response.push(new ListView(ctx, list).send(true));
            response.push(new NotificationView(ctx, list).send());
          } catch (e) {
            // Ignore...
          }
          response.push(ctx.answerCbQuery(ctx.i18n.t('alert.msg.list.completed')).catch(() => {}));
        } else {
          response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.remove'), true).catch(() => {}));
        }
      } else {
        response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.closed'), true).catch(() => {}));
      }
    } else {
      response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.invalid'), true).catch(() => {}));
    }
    return Promise.all(response);
  }

  /**
   * Mark user as not going.
   * @param ctx
   * @returns {Promise<unknown[]>}
   */
  async actionLeaveUser(ctx) {
    const response = [];
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const list = await this.listQueries.getSingleFromChat(chatId, messageId);
    if (list !== null) {
      if (!list.isClosed) {
        const index = list.ListUsers.findIndex((value) => value.userId === userId);
        if (index >= 0 && list.ListUsers[index].state === 0) {
          list.ListUsers[index].state = -1; // Mark not going
          await list.ListUsers[index].save();
          ctx.i18n.locale(list.language);
          try {
            response.push(new ListView(ctx, list).send(true));
            response.push(new NotificationView(ctx, list).send());
          } catch (e) {
            // Ignore...
          }
          response.push(ctx.answerCbQuery(ctx.i18n.t('alert.msg.list.removed')).catch(() => {}));
        } else {
          response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.remove'), true).catch(() => {}));
        }
      } else {
        response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.closed'), true).catch(() => {}));
      }
    } else {
      response.push(ctx.answerCbQuery(ctx.i18n.t('alert.err.list.invalid'), true).catch(() => {}));
    }
    return Promise.all(response);
  }
}

module.exports = ListContext;
