const norm = require('normalize-type').default;

module.exports = (string = undefined, fallback = null) => {
  if (string !== undefined) {
    return norm(string);
  }
  return fallback;
};
