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
    bot.on('contact', (ctx) => this.contactHandler(ctx));
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
      }
    } else {
      const list = await this.queries.getSingleFromUserId(ctx.from.id);
      if (list == null) {
        ctx.reply(ctx.i18n.t('list.err.create'));
      } else {
        await this.handleMessageState(list, ctx);
      }
    }
  }

  /**
   * Handles contact shares.
   * @returns {Promise<void>}
   */
  async contactHandler(ctx) {
    if (ctx.chat.type === 'private') {
      const list = await this.queries.getSingleFromUserId(ctx.from.id);
      if (list == null) {
        ctx.reply(ctx.i18n.t('list.err.create'));
      } else {
        list.associateId = ctx.update.message.contact.user_id;
        await list.save();
        await ctx.reply(ctx.i18n.t('list.state.contact', { u: ctx.update.message.contact.first_name }), {
          parse_mode: 'markdown',
        });
      }
    }
  }

  /**
   * Create listing command.
   * @param ctx
   */
  async baseCommand(ctx) {
    if (ctx.chat.type === 'private') {
      const existing = await this.queries.getSingleFromUserId(ctx.from.id);
      if (existing) {
        await existing.destroy();
      }
      const created = await this.queries.createList(ctx);
      if (created) {
        await created.reload();
        await this.sendStateMessage(created, ctx);
      }
    }
  }

  /**
   * Send message by state type. Returns promise.
   * @param q
   * @param ctx
   * @returns {null}
   */
  async sendStateMessage(q, ctx) {
    ctx.i18n.locale(q.language);
    switch (q.state) {
      case this.STATE_ISLAND:
        await ctx.reply(ctx.i18n.t('list.state.island'));
        break;
      case this.STATE_PRICE:
        await ctx.reply(ctx.i18n.t('list.state.price'));
        break;
      case this.STATE_READY:
        await new Preview(ctx, q).sendPreview();
        break;
      case this.STATE_MAX_USERS:
        await ctx.reply(ctx.i18n.t('list.state.users'));
        break;
      case this.STATE_SET_NOTIFICATION:
        await ctx.reply(ctx.i18n.t('list.state.notification'));
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
    ctx.i18n.locale(q.language);
    const expectedMessage = ctx.message.text;
    switch (q.state) {
      case this.STATE_ISLAND:
        if (expectedMessage.length < 255) {
          q.island = expectedMessage;
          q.state = this.STATE_PRICE;
          await q.save();
          await this.sendStateMessage(q, ctx);
        } else {
          await ctx.reply(ctx.i18n.t('list.err.island'));
        }
        break;
      case this.STATE_PRICE:
        if (/^\d+$/.test(expectedMessage)) {
          const max = Number(process.env.MAX_PRICE || 800);
          if (Number(expectedMessage) <= max) {
            q.price = expectedMessage;
            q.state = this.STATE_READY;
            await q.save();
            await this.sendStateMessage(q, ctx);
          } else {
            await ctx.reply(ctx.i18n.t('list.err.numbermin', { n: max }), { parse_mode: 'Markdown' });
          }
        } else {
          await ctx.reply(ctx.i18n.t('list.err.number'));
        }
        break;
      case this.STATE_MAX_USERS:
        if (/^\d+$/.test(expectedMessage)) {
          const max = Number(process.env.MAX_LIST_USERS || 100);
          if (Number(expectedMessage) <= max) {
            q.maxUsers = expectedMessage;
            q.state = this.STATE_READY;
            await q.save();
            await this.sendStateMessage(q, ctx);
          } else {
            await ctx.reply(ctx.i18n.t('list.err.numbermin', { n: max }), { parse_mode: 'Markdown' });
          }
        } else {
          await ctx.reply(ctx.i18n.t('list.err.number'));
        }
        break;
      case this.STATE_SET_NOTIFICATION:
        if (/^\d+$/.test(expectedMessage)) {
          const max = Number(process.env.MAX_LIST_USERS || 100);
          if (Number(expectedMessage) <= max) {
            q.notification = expectedMessage;
            q.state = this.STATE_READY;
            await q.save();
            await this.sendStateMessage(q, ctx);
          } else {
            await ctx.reply(ctx.i18n.t('list.err.numbermin', { n: max }), { parse_mode: 'Markdown' });
          }
        } else {
          await ctx.reply(ctx.i18n.t('list.err.number'));
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
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list == null) {
      await ctx.reply(ctx.i18n.t('list.err.create'));
    } else {
      list.state = this.STATE_MAX_USERS;
      await list.save();
      this.sendStateMessage(list, ctx);
    }
    await ctx.answerCbQuery().catch(() => {});
  }

  /**
   * Set table row as expecting notification threshold.
   * @param ctx
   */
  async actionSetNotification(ctx) {
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list == null) {
      await ctx.reply(ctx.i18n.t('list.err.create'));
    } else {
      list.state = this.STATE_SET_NOTIFICATION;
      await list.save();
      this.sendStateMessage(list, ctx);
    }
    await ctx.answerCbQuery().catch(() => {});
  }

  /**
   * Cancel the creation process.
   * @param ctx
   */
  async actionCancel(ctx) {
    const list = await this.queries.getSingleFromUserId(ctx.from.id);
    if (list !== null) {
      await ctx.i18n.locale(list.language);
      await list.destroy();
      await ctx.reply(ctx.i18n.t('list.cancel.main'));
    } else {
      await ctx.reply(ctx.i18n.t('list.cancel.none'));
    }
    await ctx.answerCbQuery().catch(() => {});
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
      ctx.i18n.locale(list.language);
      const message = await new ListView(ctx, list).send();
      if (message) {
        list.publicChatId = message.chat.id;
        list.publicMessageId = message.message_id;
        await list.save();
      }
    }
  }

  /**
   * Add user to list. Only if list exists and not already on.
   * Only allows users with @username. Else notifies via private.
   * @param ctx
   * @returns {Promise<void>}
   */
  async actionAddUser(ctx) {
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
                  await new ListView(ctx, list).send(true);
                } catch (e) {
                  // Ignore...
                }
                await ctx.answerCbQuery(ctx.i18n.t('alert.msg.list.joined')).catch(() => {});
              } else {
                await ctx.answerCbQuery(ctx.i18n.t('alert.err.list.create'), true).catch(() => {});
              }
            } else {
              await ctx.answerCbQuery(ctx.i18n.t('alert.err.list.limit'), true).catch(() => {});
            }
          } else {
            await ctx.answerCbQuery(ctx.i18n.t('alert.err.list.add'), true).catch(() => {});
          }
        } else {
          await ctx.answerCbQuery(ctx.i18n.t('alert.err.list.closed'), true).catch(() => {});
        }
      } else {
        await ctx.answerCbQuery(ctx.i18n.t('alert.err.list.invalid'), true).catch(() => {});
      }
    } else {
      await ctx.answerCbQuery(ctx.i18n.t('nousername'), true).catch(() => {});
    }
  }

  /**
   * Mark user as complete.
   * @param ctx
   * @returns {Promise<void>}
   */
  async actionCompleteUser(ctx) {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const list = await this.listQueries.getSingleFromChat(chatId, messageId);
    if (list !== null) {
      if (!list.isClosed) {
        const index = list.ListUsers.findIndex((value) => value.userId === userId);
        if (index >= 0 && !list.ListUsers[index].finished) {
          list.ListUsers[index].finished = true; // Mark complete
          await list.ListUsers[index].save(); // User change in database
          ctx.i18n.locale(list.language);
          try {
            await new ListView(ctx, list).send(true);
            await new NotificationView(ctx, list).send();
          } catch (e) {
            // Ignore...
          }
          await ctx.answerCbQuery(ctx.i18n.t('alert.msg.list.removed')).catch(() => {});
        } else {
          await ctx.answerCbQuery(ctx.i18n.t('alert.err.list.remove'), true).catch(() => {});
        }
      } else {
        await ctx.answerCbQuery(ctx.i18n.t('alert.err.list.closed'), true).catch(() => {});
      }
    } else {
      await ctx.answerCbQuery(ctx.i18n.t('alert.err.list.invalid'), true).catch(() => {});
    }
  }
}

module.exports = ListContext;
