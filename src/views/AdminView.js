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
    output += `${this.ctx.i18n.t('view.admin.island', { island: this.data.island })}\n`;
    if (this.data.associateId) {
      output += this.ctx.i18n.t('view.admin.assoc');
    }
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
    if (this.ctx.from.language_code !== this.data.language) {
      const currentLang = this.ctx.i18n.locale();
      this.ctx.i18n.locale(this.ctx.from.language_code);
      keyboard.push([{ text: this.ctx.i18n.t('view.admin.kb.lang'), callback_data: 'set_language' }]);
      this.ctx.i18n.locale(currentLang);
    }
    if (this.data.associateId && this.ctx.from.id !== this.data.associateId) {
      keyboard.push([{ text: this.ctx.i18n.t('view.admin.kb.assoc'), callback_data: 'remove_associate' }]);
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
        if (user.state === 0) {
          keyboard.push([
            { text: `${order} @${user.username} ✅`, callback_data: `manage_complete?forceId=${user.userId}` },
            { text: `${order} @${user.username} ❌`, callback_data: `manage_leave?forceId=${user.userId}` },
          ]);
        }
      });
    }
    return { inline_keyboard: keyboard };
  }

  /**
   * Send it.
   * @param withKeyboard
   * @param update
   */
  async send(withKeyboard = true, update = false) {
    let keyboard = null;
    if (withKeyboard) {
      keyboard = this.markup();
    }
    if (update) {
      try {
        await this.ctx.editMessageText(this.render(), {
          parse_mode: 'markdown',
          reply_markup: keyboard,
        });
      } catch (e) {
        // Ignore...
      }
    } else {
      await this.ctx.telegram.sendMessage(this.ctx.from.id, this.render(), { parse_mode: 'Markdown', reply_markup: keyboard });
    }
  }

  /**
   * Send user list.
   * @param update
   */
  async sendUserList(update = false) {
    const markup = this.userKeyboardMarkup();
    if (update) {
      try {
        await this.ctx.editMessageText(this.render(), { parse_mode: 'markdown', reply_markup: markup });
      } catch (e) {
        // Ignore...
      }
    } else {
      await this.ctx.reply(this.render(), { parse_mode: 'markdown', reply_markup: markup });
    }
  }
}

module.exports = AdminView;
