/**
 * Gets query vars from callback_data
 * @returns {null}
 * @param query
 * @param variable
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
