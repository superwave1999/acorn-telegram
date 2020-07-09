const msgId = '🆔 ';

class AdminView {
  constructor(ctx, data) {
    this.ctx = ctx;
    this.data = data;
  }

  /**
   * Render main output
   * @returns {string}
   */
  render() {
    let output = `${msgId}${this.data.id}\n`;
    output += `${this.ctx.i18n.t('view.admin.title')}\n`;
    output += `${this.ctx.i18n.t('view.admin.island')}_${this.data.island}_\n`;
    return output;
  }

  /**
   * Admin keyboard
   */
  markup() {
    const keyboard = [];
    if (this.data.ListUsers && this.data.ListUsers.length > 0) {
      keyboard.push([{ text: this.ctx.i18n.t('view.admin.kb.manage'), callback_data: 'manage_users' }]);
    }
    if (this.data.isClosed) {
      keyboard.push([{ text: this.ctx.i18n.t('view.admin.kb.unlock'), callback_data: 'manage_lock?state=0' }]);
    } else {
      keyboard.push([{ text: this.ctx.i18n.t('view.admin.kb.lock'), callback_data: 'manage_lock?state=1' }]);
    }
    return { inline_keyboard: keyboard };
  }

  /**
   * Remove user keyboard
   * @returns {{inline_keyboard: []}}
   */
  userKeyboardMarkup() {
    const keyboard = [];
    keyboard.push([{ text: this.ctx.i18n.t('view.admin.kb.return'), callback_data: 'refresh_list' }]);
    if (this.data.ListUsers) {
      let order = 0;
      this.data.ListUsers.forEach((user) => {
        order += 1;
        keyboard.push([{ text: `${order}. @${user.username}`, callback_data: `manage_complete?forceId=${user.userId}` }]);
      });
    }
    return { inline_keyboard: keyboard };
  }

  /**
   * Send it.
   * @param ctx
   * @param withKeyboard
   * @param update
   */
  send(withKeyboard = true, update = false) {
    let message = null;
    let keyboard = null;
    if (withKeyboard) {
      keyboard = this.markup();
    }
    if (update) {
      try {
        message = this.ctx.editMessageText(this.render(), {
          parse_mode: 'markdown',
          reply_markup: keyboard,
        });
      } catch (e) {
        // Ignore...
      }
    } else {
      message = this.ctx.telegram.sendMessage(this.ctx.from.id, this.render(), { parse_mode: 'Markdown', reply_markup: keyboard });
    }
    return message;
  }

  /**
   * Send user list.
   * @param ctx
   * @param update
   */
  sendUserList(update = false) {
    let message = null;
    const markup = this.userKeyboardMarkup();
    if (update) {
      try {
        message = this.ctx.editMessageText(this.render(), { parse_mode: 'markdown', reply_markup: markup });
      } catch (e) {
        // Ignore...
      }
    } else {
      message = this.ctx.reply(this.render(), { parse_mode: 'markdown', reply_markup: markup });
    }
    return message;
  }
}

module.exports = AdminView;
