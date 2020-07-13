const CleanupRepository = require('../database/queries/cleanup');

/**
 * Cleans the database of old untouched lists.
 * @returns {{publicChatId: (*|string), publicMessageId: (*|string)}}
 * @param db
 */
module.exports = async (db) => {
  await new CleanupRepository(db).getStaleLists(true);
  process.stdout.write('Database pruned!\n');
  return true;
};
