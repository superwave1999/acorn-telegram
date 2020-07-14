class ListView {
  constructor(ctx, data, useChatId = false) {
    this.ctx = ctx;
    this.data = data;
    this.useChatId = useChatId;
  }

  /**
   * Render main output
   * @returns {string}
   */
  render() {
    let output = '';
    output += `${this.ctx.i18n.t('view.list.title')}\n`;
    output += `${this.ctx.i18n.t('view.list.price', { price: this.data.price })}\n`;
    output += `${this.ctx.i18n.t('view.list.island', { island: this.data.island })}\n`;
    if (this.data.ListUsers && this.data.ListUsers.length >= this.data.maxUsers) {
      output += `${this.ctx.i18n.t('view.list.users.limit')}\n`;
    } else {
      output += `${this.ctx.i18n.t('view.list.users.max', { max: this.data.maxUsers })}\n`;
    }
    output += this.renderUserRows();
    if (this.data.isClosed) {
      output += `${this.ctx.i18n.t('view.list.locked')}\n`;
    }
    return output;
  }

  /**
   * Render user listing.
   * @returns {string}
   */
  renderUserRows() {
    let output = '';
    if (this.data.ListUsers) {
      let order = 0;
      this.data.ListUsers.forEach((user) => {
        order += 1;
        output += `*${order}* `;
        if (user.state === 1) {
          output += '✅';
        } else if (user.state === -1) {
          output += '❌';
        } else {
          output += '🟨';
        }
        output += ` [@${user.username}](tg://user?id=${user.userId})\n`;
      });
    }
    return output;
  }

  /**
   * Main listing markup buttons.
   */
  markup() {
    return {
      inline_keyboard: [
        [{ text: this.ctx.i18n.t('view.list.kb.add'), callback_data: 'add_user' }],
        [
          { text: this.ctx.i18n.t('view.list.kb.complete'), callback_data: 'complete_user' },
          { text: this.ctx.i18n.t('view.list.kb.leave'), callback_data: 'leave_user' },
        ],
        [{ text: this.ctx.i18n.t('view.list.kb.options'), callback_data: 'manage_list' }],
      ],
    };
  }

  /**
   * Send it.
   * @param update
   * @param newData
   */
  send(update = false, newData = null) {
    let message = null;
    if (newData) {
      this.data = newData;
    }
    const text = this.render();
    const markup = this.markup();
    if (update) {
      if (this.useChatId) {
        message = this.ctx.telegram.editMessageText(
          this.data.publicChatId,
          this.data.publicMessageId,
          null,
          text,
          {
            parse_mode: 'Markdown',
            reply_markup: markup,
          },
        );
      } else {
        message = this.ctx.editMessageText(
          text,
          {
            parse_mode: 'markdown',
            reply_markup: markup,
          },
        );
      }
    } else if (this.useChatId) {
      message = this.ctx.telegram.sendMessage(
        this.data.publicChatId,
        text,
        {
          parse_mode: 'Markdown',
          reply_markup: markup,
        },
      );
    } else {
      message = this.ctx.reply(
        text,
        {
          parse_mode: 'markdown',
          reply_markup: markup,
        },
      );
    }
    return message;
  }
}

module.exports = ListView;
