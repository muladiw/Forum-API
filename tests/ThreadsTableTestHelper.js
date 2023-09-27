/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const ThreadsTableTestHelper = {
  async addThread({
    id = 'thread-123', title = 'sebuah title', body = 'sebuah body', owner = 'user-123',
  }) {
    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4)',
      values: [id, title, body, owner],
    };

    await pool.query(query);
  },
  async findThreadsById(id) {
    const query = {
      text: 'SELECT * FROM threads WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },
  async findCommentsById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },
  async getComments() {
    const query = {
      text: 'SELECT * FROM comments',
    };

    const result = await pool.query(query);
    return result.rows;
  },
  addComment({
    id = 'comment-123', content = 'sebuah komen', owner = 'user-123', threadId = 'thread-123', commentId = null, isDelete = false, date = new Date(Date.now()),
  }) {
    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, content, owner, thread_id, comment_id, date, is_delete',
      values: [id, content, owner, threadId, commentId, isDelete, date],
    };

    return pool.query(query);
  },
  async findCommentLikeById(id) {
    const query = {
      text: 'SELECT * FROM user_comment_likes WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },
  addCommentLike({ id = 'comment-like-123', userId = 'user-123', commentId = 'comment-id' }) {
    const query = {
      text: 'INSERT INTO user_comment_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, commentId, userId],
    };

    return pool.query(query);
  },
  async cleanTable() {
    await pool.query('DELETE FROM user_comment_likes WHERE 1=1');
    await pool.query('DELETE FROM threads WHERE 1=1');
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

module.exports = ThreadsTableTestHelper;
