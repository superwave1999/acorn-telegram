/**
 * Gets query vars from callback_data
 * @param original
 * @returns {{publicChatId: (*|string), publicMessageId: (*|string)}}
 */
module.exports = (query, variable) => {
  const sep = query.split('?');
  let found = null;
  if (sep.length > 1) {
    const pairs = sep[1].split('&');
    pairs.forEach((pair) => {
      const [v, data] = pair.split('=');
      if (v === variable) {
        found = data;
      }
    });
  }
  return found;
};
