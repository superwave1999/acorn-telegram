const ListView = require('./ListView');

class PreviewView extends ListView {
  /**
   * Send a preview.
   * @param ctx
   * @param update
   * @param newData
   */
  sendPreview(ctx, update = false, newData = null) {
    let message = null;
    if (newData) {
      this.data = newData;
    }
    const markup = this.markupPreview();
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

  /**
   * Keyboard on the preview.
   */
  markupPreview() {
    return {
      inline_keyboard: [
        [
          {
            text: `User limit (${this.data.maxUsers})`,
            callback_data: 'set_max_users',
          },
          {
            text: `Notification (${this.data.notification})`,
            callback_data: 'set_notification',
          },
        ],
        [
          {
            text: 'Send to group',
            switch_inline_query: 'get',
          },
          {
            text: 'Cancel',
            callback_data: 'cancel_creation',
          },
        ],
      ],
    };
  }
}

module.exports = PreviewView;
