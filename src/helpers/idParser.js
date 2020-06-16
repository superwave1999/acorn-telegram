/**
 * Parses the id/message combo on management messages
 * @param original
 * @returns {{publicChatId: (*|string), publicMessageId: (*|string)}}
 */
module.exports = (original) => {
  const firstLine = original.split('\n')[0];
  return firstLine.replace('🆔 ', '');
};
