class InitContext {
  constructor(bot) {
    bot.start((ctx) => this.contextCommon(ctx, this.baseCommand));
    bot.help((ctx) => this.contextCommon(ctx, this.helpCommand));
    return bot;
  }

  /**
   * Technically middleware. Queries and shit must be done in private.
   */
  contextCommon(ctx, func) {
    if (ctx.chat.type === 'private') {
      func(ctx);
    } else {
      // TODO: Send no-op
    }
  }

  /**
   * Run on start.
   */
  baseCommand(ctx) {
    ctx.reply(ctx.i18n.t('command.start'));
  }

  /**
   * Tutorial.
   */
  helpCommand(ctx) {
    ctx.reply(ctx.i18n.t('command.help'));
  }
}

module.exports = InitContext;
