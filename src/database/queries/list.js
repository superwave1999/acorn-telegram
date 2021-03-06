class GeneralRepository {
  constructor(db) {
    this.db = db;
    this.order = [
      ['createdAt', 'DESC'],
      [{ model: this.db.ListUser }, 'id', 'ASC'],
      [{ model: this.db.ListUser }, 'createdAt', 'ASC'],
    ];
    this.include = [
      {
        model: this.db.ListUser,
        required: false,
      },
    ];
  }

  /**
   * Get list from id only.
   * @param listId
   * @returns {Promise<Model | null> | Promise<Model>}
   */
  getSingleFromId(listId) {
    const query = {
      where: {
        id: listId,
      },
      order: this.order,
      include: this.include,
    };
    return this.db.List.findOne(query);
  }

  /**
   * Get list from chat/message pair.
   * @param chatId
   * @param messageId
   * @returns {Promise<Model | null> | Promise<Model>}
   */
  getSingleFromChat(chatId, messageId) {
    const query = {
      where: {
        publicChatId: chatId,
        publicMessageId: messageId,
      },
      order: this.order,
      include: this.include,
    };
    return this.db.List.findOne(query);
  }

  /**
   * Add user to list.
   * @param listId
   * @param user
   * @returns {params}
   */
  createUser(listId, user) {
    const params = {
      listId,
      userId: user.id,
      username: user.username,
      state: 0,
      notified: false,
    };
    return this.db.ListUser.create(params);
  }
}

module.exports = GeneralRepository;
