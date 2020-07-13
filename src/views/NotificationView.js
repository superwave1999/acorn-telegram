class NotificationView {
  constructor(ctx, data) {
    this.ctx = ctx;
    this.data = data;
  }

  /**
   * Render notification
   * @returns {string}
   */
  renderNotification() {
    let output = `${this.ctx.i18n.t('view.notify')}\n`;
    output += `${this.ctx.i18n.t('view.list.island', { island: this.data.island })}\n`;
    output += `${this.ctx.i18n.t('view.notifypin')}`;
    return output;
  }

  /**
   * Send the notification.
   */
  async send() {
    const results = [];
    const saves = [];
    if (this.data.notification > 0 && this.data.ListUsers) {
      let order = 0;
      this.data.ListUsers.forEach((user) => {
        if (!user.finished) {
          order += 1;
          if (!user.notified && this.data.notification === order) {
            results.push(this.ctx.telegram.sendMessage(user.userId, this.renderNotification(), { parse_mode: 'Markdown' }));
            user.notified = true;
            saves.push(user.save());
          }
        }
      });
    }
    await Promise.all(results);
    await Promise.all(saves);
  }
}

module.exports = NotificationView;
