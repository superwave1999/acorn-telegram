const msgId = '🆔 ';
const defaultTitle = '🌰 *Administration menu*';
const msgIsland = '🏝️ ';

class AdminView {
  constructor(data) {
    this.data = data;
  }

  /**
   * Render main output
   * @returns {string}
   */
  render() {
    let output = `${msgId}${this.data.id}\n`;
    output += `${defaultTitle}\n`;
    output += `${msgIsland}_${this.data.island}_\n`;
    return output;
  }

  /**
   * Admin keyboard
   */
  markup() {
    const keyboard = [];
    if (this.data.ListUsers && this.data.ListUsers.length > 0) {
      keyboard.push([{ text: 'Manage users', callback_data: 'manage_users' }]);
    }
    if (this.data.isClosed) {
      keyboard.push([{ text: 'Unlock list', callback_data: 'manage_lock?state=0' }]);
    } else {
      keyboard.push([{ text: 'Lock list', callback_data: 'manage_lock?state=1' }]);
    }
    return { inline_keyboard: keyboard };
  }

  /**
   * Remove user keyboard
   * @returns {{inline_keyboard: []}}
   */
  userKeyboardMarkup() {
    const keyboard = [];
    keyboard.push([{ text: 'Return', callback_data: 'refresh_list' }]);
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
  send(ctx, withKeyboard = true, update = false) {
    let message = null;
    let keyboard = null;
    if (withKeyboard) {
      keyboard = this.markup();
    }
    if (update) {
      try {
        message = ctx.editMessageText(this.render(), {
          parse_mode: 'markdown',
          reply_markup: keyboard,
        });
      } catch (e) {
        // Ignore...
      }
    } else {
      message = ctx.telegram.sendMessage(ctx.from.id, this.render(), { parse_mode: 'Markdown', reply_markup: keyboard });
    }
    return message;
  }

  /**
   * Send user list.
   * @param ctx
   * @param update
   */
  sendUserList(ctx, update = false) {
    let message = null;
    const markup = this.userKeyboardMarkup();
    if (update) {
      try {
        message = ctx.editMessageText(this.render(), { parse_mode: 'markdown', reply_markup: markup });
      } catch (e) {
        // Ignore...
      }
    } else {
      message = ctx.reply(this.render(), { parse_mode: 'markdown', reply_markup: markup });
    }
    return message;
  }
}

module.exports = AdminView;
