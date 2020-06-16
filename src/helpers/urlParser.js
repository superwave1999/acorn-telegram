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
      const v = pair.split('=');
      if (v[0] === variable) {
        found = v[1];
      }
    });
  }
  return found;
};
