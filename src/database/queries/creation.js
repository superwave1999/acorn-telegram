class CreationRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create new list. If list with matching properties exists, use that.
   * @param userObj
   * @returns {Promise<[Model, boolean]>}
   */
  createList(ctx) {
    const insert = {
      creatorId: ctx.from.id,
      language: ctx.from.language_code,
      state: 0,
      maxUsers: 50,
      notification: 4,
      isClosed: false,
      publicChatId: null,
      publicMessageId: null,
    };
    return this.db.List.findOrCreate({ where: insert });
  }

  /**
   * Gets the most recent list by the user that has not been shared.
   * @param userId
   * @param include
   * @returns {Promise<Model | null> | Promise<Model>}
   */
  getSingleFromUserId(userId) {
    const query = {
      where: {
        creatorId: userId,
        isClosed: false,
        publicChatId: null,
        publicMessageId: null,
      },
      order: [['createdAt', 'DESC']],
    };
    return this.db.List.findOne(query);
  }
}

module.exports = CreationRepository;
