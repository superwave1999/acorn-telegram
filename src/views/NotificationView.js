const defaultTitle = '🌰 *Its your turn soon!*';
const msgIsland = '🏝️ ';

class NotificationView {
  constructor(data) {
    this.data = data;
  }

  /**
   * Render main output
   * @returns {string}
   */
  render() {
    let output = `${defaultTitle}\n`;
    output += `${msgIsland}_${this.data.island}_`;
    return output;
  }
}

module.exports = NotificationView;
