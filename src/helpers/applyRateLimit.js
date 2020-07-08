/**
 * Limits requests under following conditions:
 * Same user in same chat.
 * Text message (callbacks allowed).
 * The message is not the activator.
 * @param ctx
 * @returns {*|Chat|number|boolean}
 */
module.exports = (ctx) => ctx.from && ctx.from.id
  && ctx.chat && ctx.chat.id
  && ctx.updateType === 'message'
  && ctx.message && ctx.message.text !== `@${process.env.BOT_USERNAME} get`;
