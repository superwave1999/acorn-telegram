const ListView = require('./ListView');

class PreviewView extends ListView {
  /**
   * Send a preview.
   * @param ctx
   * @param update
   * @param newData
   */
  sendPreview(update = false, newData = null) {
    let message = null;
    if (newData) {
      this.data = newData;
    }
    const markup = this.markupPreview();
    if (update) {
      message = this.ctx.editMessageText(this.render(), {
        parse_mode: 'Markdown',
        reply_markup: markup,
      }).catch();
    } else {
      message = this.ctx.reply(this.render(), {
        parse_mode: 'Markdown',
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
            text: `${this.ctx.i18n.t('view.create.kb.limit', { c: this.data.maxUsers })}`,
            callback_data: 'set_max_users',
          },
          {
            text: `${this.ctx.i18n.t('view.create.kb.notify', { c: this.data.notification })}`,
            callback_data: 'set_notification',
          },
        ],
        [
          {
            text: this.ctx.i18n.t('view.create.kb.send'),
            switch_inline_query: 'get',
          },
          {
            text: this.ctx.i18n.t('view.create.kb.cancel'),
            callback_data: 'cancel_creation',
          },
        ],
      ],
    };
  }
}

module.exports = PreviewView;
