const defaultTitle = '🌰 *Trade listing*';
const msgPrice = '💰 ';
const msgIsland = '🏝️ ';
const msgUsers = '🧍 ';
const msgLocked = '⚠️ *LISTING LOCKED*';

class ListView {
  constructor(data, useChatId = false) {
    this.data = data;
    this.useChatId = useChatId;
  }

  /**
   * Render main output
   * @returns {string}
   */
  render() {
    let output = '';
    output += `${defaultTitle}\n`;
    output += `${msgPrice}${this.data.price}\n`;
    output += `${msgIsland}_${this.data.island}_\n`;
    if (this.data.countUsers > this.data.maxUsers) {
      output += `${msgUsers} Limit reached!\n`;
    } else {
      output += `${msgUsers}Max: ${this.data.maxUsers}\n`;
    }
    output += this.renderUserRows();
    if (this.data.isClosed) {
      output += `${msgLocked}\n`;
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
        output += `${order}. [@${user.username}](tg://user?id=${user.userId})\n`;
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
        [{ text: 'I\'m going', callback_data: 'add_user' }],
        [{ text: 'Done', callback_data: 'complete_user' }],
        [{ text: 'Options', callback_data: 'manage_list' }],
      ],
    };
  }

  /**
   * Send it.
   * @param ctx
   * @param update
   * @param adminMenu
   * @param newData
   */
  send(ctx, update = false, newData = null) {
    let message = null;
    if (newData) {
      this.data = newData;
    }
    const text = this.render();
    const markup = this.markup();
    if (update) {
      if (this.useChatId) {
        message = ctx.telegram.editMessageText(
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
        try {
          message = ctx.editMessageText(
            text,
            {
              parse_mode: 'markdown',
              reply_markup: markup,
            },
          );
        } catch (e) {
          // Ignore...
        }
      }
    } else if (this.useChatId) {
      message = ctx.telegram.sendMessage(
        this.data.publicChatId,
        text,
        {
          parse_mode: 'Markdown',
          reply_markup: markup,
        },
      );
    } else {
      message = ctx.reply(
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
