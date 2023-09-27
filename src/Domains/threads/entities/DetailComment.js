class DetailThread {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, content, username, date, replies, isDelete, commentId,
    } = payload;

    this.id = id;
    if (isDelete) {
      this.content = commentId ? '**balasan telah dihapus**' : '**komentar telah dihapus**';
    } else this.content = content;
    this.username = username;
    this.date = date;
    this.replies = replies;
  }

  _verifyPayload({
    id, content, username, date,
  }) {
    if (!id || !content || !username || !date) {
      throw new Error('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof id !== 'string' || typeof content !== 'string' || typeof username !== 'string') {
      throw new Error('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }

    if (!(date instanceof Date)) {
      throw new Error('DETAIL_COMMENT.DATE_NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DetailThread;
