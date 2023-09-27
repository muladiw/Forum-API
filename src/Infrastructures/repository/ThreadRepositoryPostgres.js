const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const AddedThread = require('../../Domains/threads/entities/AddedThread');
const AddedComment = require('../../Domains/threads/entities/AddedComment');
const DetailThread = require('../../Domains/threads/entities/DetailThread');
const DetailComment = require('../../Domains/threads/entities/DetailComment');
const InvariantError = require('../../Commons/exceptions/InvariantError');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(owner, addThread) {
    const { title, body } = addThread;
    const id = `thread-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4) RETURNING id, title, owner',
      values: [id, title, body, owner],
    };

    const result = await this._pool.query(query);

    return new AddedThread({ ...result.rows[0] });
  }

  async getThreadById(id) {
    const query = {
      text: `SELECT threads.*, users.username FROM threads
        INNER JOIN users ON users.id = threads.owner
        WHERE threads.id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('id thread tidak ditemukan di database');
    }

    return new DetailThread({ ...result.rows[0] });
  }

  async addComment(owner, threadId, addComment) {
    const { content } = addComment;
    const id = `comment-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4) RETURNING id, content, owner',
      values: [id, content, owner, threadId],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async softDeleteCommentByCommentId(commentId) {
    const query = {
      text: 'UPDATE comments SET is_delete = $1 WHERE id = $2 RETURNING id',
      values: [true, commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal menghapus comment. Id tidak ditemukan');
    }
  }

  async verifyCommentOwner(owner, threadId, commentId) {
    const query = {
      text: 'SELECT * FROM comments WHERE thread_id = $1 AND id = $2',
      values: [threadId, commentId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('id comment tidak ditemukan di database');
    }
    const comment = result.rows[0];
    if (comment.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async getCommentsByThreadId(id) {
    const query = {
      text: `SELECT comments.*, users.username FROM comments
        INNER JOIN threads ON threads.id = comments.thread_id
        INNER JOIN users ON users.id = comments.owner
        WHERE comments.thread_id = $1 AND comments.comment_id IS NULL
        ORDER BY comments.date`,
      values: [id],
    };
    const result = await this._pool.query(query);
    return result.rows.map((item) => new DetailComment({
      ...item, isDelete: item.is_delete, commentId: item.comment_id,
    }));
  }

  async verifyAvailableComment(threadId, commentId) {
    const query = {
      text: 'SELECT * FROM comments WHERE thread_id = $1 AND id = $2',
      values: [threadId, commentId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('id balasan tidak ditemukan di database');
    }

    if (result.rows[0].comment_id) {
      throw new InvariantError('balasan tidak bisa dikomentar');
    }
  }

  async addReply(owner, threadId, commentId, addReply) {
    const { content } = addReply;
    const id = `reply-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5) RETURNING id, content, owner',
      values: [id, content, owner, threadId, commentId],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async getReplies(threadId, commentId) {
    const query = {
      text: `SELECT comments.*, users.username FROM comments
        INNER JOIN users ON users.id = comments.owner
        WHERE comments.thread_id = $1 AND comments.comment_id = $2
        ORDER BY comments.date`,
      values: [threadId, commentId],
    };
    const result = await this._pool.query(query);
    return result.rows.map((item) => new DetailComment({
      ...item, isDelete: item.is_delete, commentId: item.comment_id,
    }));
  }

  async verifyReplyOwner(owner, threadId, commentId, replyId) {
    const query = {
      text: 'SELECT * FROM comments WHERE thread_id = $1 AND comment_id = $2 AND id = $3',
      values: [threadId, commentId, replyId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('id balasan tidak ditemukan di database');
    }
    const comment = result.rows[0];
    if (comment.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async softDeleteReplyByReplyId(replyId) {
    const query = {
      text: 'UPDATE comments SET is_delete = $1 WHERE id = $2 RETURNING id',
      values: [true, replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal menghapus balasan. Id tidak ditemukan');
    }
  }

  async addCommentLike(userId, commentId) {
    const id = `comment-like-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO user_comment_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, commentId, userId],
    };

    await this._pool.query(query);
  }

  async verifyAvailableCommentLike(userId, commentId) {
    const query = {
      text: 'SELECT * FROM user_comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('id menyukai komentar tidak ditemukan di database');
    }

    return result.rows[0];
  }

  async deleteCommentLikeByCommentLikeId(commentLikeId) {
    const query = {
      text: 'DELETE FROM user_comment_likes WHERE id = $1 RETURNING id',
      values: [commentLikeId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Menyukai komentar gagal dihapus. Id tidak ditemukan');
    }
  }

  async countCommentLikeByCommentId(commentId) {
    const query = {
      text: 'SELECT COUNT(*) count_like FROM user_comment_likes WHERE comment_id = $1',
      values: [commentId],
    };
    const result = await this._pool.query(query);

    return {
      countLike: result.rowCount ? parseInt(result.rows[0].count_like, 10) : 0,
    };
  }
}

module.exports = ThreadRepositoryPostgres;
