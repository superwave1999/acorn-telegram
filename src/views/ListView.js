const defaultTitle = '🌰 *Trade listing*';
const msgPrice = '💰 ';
const msgIsland = '🏝️ ';
const msgUsers = '🧍 ';
const msgLocked = '⚠️ *LISTING LOCKED*';

class ListView {
  constructor(data) {
    this.data = data;
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
  send(ctx, update = false, adminMenu = false, newData = null) {
    let message = null;
    if (newData) {
      this.data = newData;
    }
    let keyboard = {};
    if (adminMenu) {
      keyboard = this.adminKeyboard();
      // TODO: Remove above
    }
    const markup = { ...this.markup(), ...keyboard };
    if (update) {
      try {
        message = ctx.editMessageText(this.render(), {
          parse_mode: 'markdown',
          reply_markup: markup,
        });
      } catch (e) {
        // Ignore...
      }
    } else {
      message = ctx.reply(this.render(), {
        parse_mode: 'markdown',
        reply_markup: markup,
      });
    }
    return message;
  }
}

module.exports = ListView;
