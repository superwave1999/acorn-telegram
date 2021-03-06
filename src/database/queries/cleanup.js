const toType = require('../../helpers/toType');

class CleanupRepository {
  constructor(db) {
    this.db = db;
    const daysToDelete = toType(process.env.DAYS_CLEANUP, 7);
    const d = new Date();
    d.setDate(d.getDate() - daysToDelete);
    this.time = d.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Get all lists not updated in time period
   * @returns {Promise<Model | null> | Promise<Model>}
   */
  getStaleLists(del = false) {
    const query = {
      where: {
        updatedAt: {
          [this.db.Sequelize.Op.lt]: this.time,
        },
      },
    };
    if (del) {
      return this.db.List.destroy(query);
    }
    return this.db.List.findAll(query);
  }
}

module.exports = CleanupRepository;
