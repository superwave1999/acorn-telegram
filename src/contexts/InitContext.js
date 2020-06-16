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
      ctx.reply('Talk to me in private!');
    }
  }

  /**
   * Run on start.
   */
  baseCommand(ctx) {
    ctx.reply('Welcome! Create your listing with /create');
  }

  /**
   * Tutorial.
   */
  helpCommand(ctx) {
    ctx.reply('1. /create your listing\n2. Send your island name\n3. Send your price\n4. (Optional) Set max users and notification setting on list\n5. Send it to a group');
  }
}

module.exports = InitContext;
