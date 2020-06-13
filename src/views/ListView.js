const defaultTitle = '🌰 *Trade listing*';
const msgPrice = '💰: ';
const msgIsland = '🏝️: ';

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
    output += `${msgPrice + this.data.price}\n`;
    output += `${msgIsland}_${this.data.island}_\n`;
    output += this.renderUserRows();
    return output;
  }

  /**
   * Render user listing.
   * @returns {string}
   */
  renderUserRows() {
    let output = '';
    let order = 0;
    Object.keys(this.data.ListUsers).forEach((key) => {
      order += 1;
      const user = this.data.ListUsers[key];
      output += `${order}. [@${user.username}](tg://user?id=${user.userId})\n`;
      return output;
    });
  }
}

module.exports = ListView;
