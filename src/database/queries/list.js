class GeneralRepository {
  constructor(db) {
    this.db = db;
  }

  getSingleFromId(listId, withUsers = true, onlyQueued = true) {
    const query = {
      where: {
        id: listId,
      },
      order: [['createdAt', 'DESC']],
    };
    if (withUsers) {
      // Only display users that are still in the queue
      const userInclude = { model: this.db.ListUser, order: [['createdAt', 'ASC']], required: false };
      if (onlyQueued) {
        userInclude.where = { finished: false };
      }
      query.include = [userInclude];
    }
    return this.db.List.findOne(query);
  }

  getSingleFromChat(chatId, messageId, withUsers = true, onlyQueued = true) {
    const query = {
      where: {
        // creatorId: userId,
        isClosed: false,
        publicChatId: chatId,
        publicMessageId: messageId,
      },
      order: [['createdAt', 'DESC']],
    };
    if (withUsers) {
      // Only display users that are still in the queue
      const userInclude = { model: this.db.ListUser, order: [['createdAt', 'ASC']], required: false };
      if (onlyQueued) {
        userInclude.where = { finished: false };
      }
      query.include = [userInclude];
    }
    return this.db.List.findOne(query);
  }

  createUser(listId, user) {
    const params = {
      finished: false,
      listId,
      userId: user.id,
      username: user.username,
    };
    return this.db.ListUser.create(params);
  }
}

module.exports = GeneralRepository;
