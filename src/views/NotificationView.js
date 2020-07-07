const defaultTitle = '🌰 *Its your turn soon!*';
const msgIsland = '🏝️ ';

class NotificationView {
  constructor(data) {
    this.data = data;
  }

  /**
   * Render notification
   * @returns {string}
   */
  renderNotification() {
    let output = `${defaultTitle}\n`;
    output += `${msgIsland}_${this.data.island}_`;
    return output;
  }

  /**
   * Send the notification.
   * @param ctx
   */
  send(ctx) {
    let message = null;
    if (this.data.ListUsers) {
      let order = 0;
      this.data.ListUsers.forEach((user) => {
        order += 1;
        if (this.data.notification === order) {
          message = ctx.telegram.sendMessage(user.userId, this.renderNotification(), { parse_mode: 'Markdown' });
        }
      });
    }
    return message;
  }
}

module.exports = NotificationView;
