const DetailComment = require('../DetailComment');

describe('DetailComment entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      username: 'title',
    };

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'id',
      username: true,
      date: new Date('2022-03-25'),
      content: 'content',
    };

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when date payload not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 'id',
      username: 'username',
      date: 'date',
      content: 'content',
    };

    // Action & Assert
    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.DATE_NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create DetailComment for comment entities correctly', () => {
    // Arrange
    const payload = {
      id: 'id',
      username: 'username',
      date: new Date('2022-03-25'),
      content: 'content',
    };

    // Action
    const detailComment = new DetailComment(payload);

    // Assert
    expect(detailComment).toBeInstanceOf(DetailComment);
    expect(detailComment.id).toEqual(payload.id);
    expect(detailComment.username).toEqual(payload.username);
    expect(detailComment.content).toEqual(payload.content);
    expect(detailComment.date).toEqual(payload.date);
  });

  it('should create DetailComment for deleted comment entities correctly', () => {
    // Arrange
    const payload = {
      id: 'id',
      username: 'username',
      date: new Date('2022-03-25'),
      content: 'content',
      isDelete: true,
    };

    // Action
    const detailComment = new DetailComment(payload);

    // Assert
    expect(detailComment).toBeInstanceOf(DetailComment);
    expect(detailComment.id).toEqual(payload.id);
    expect(detailComment.username).toEqual(payload.username);
    expect(detailComment.date).toEqual(payload.date);
    expect(detailComment.content).toEqual('**komentar telah dihapus**');
  });

  it('should create DetailComment for deleted reply entities correctly', () => {
    // Arrange
    const payload = {
      id: 'id',
      username: 'username',
      date: new Date('2022-03-25'),
      content: 'content',
      isDelete: true,
      commentId: 'comment',
    };

    // Action
    const detailComment = new DetailComment(payload);

    // Assert
    expect(detailComment).toBeInstanceOf(DetailComment);
    expect(detailComment.id).toEqual(payload.id);
    expect(detailComment.username).toEqual(payload.username);
    expect(detailComment.date).toEqual(payload.date);
    expect(detailComment.content).toEqual('**balasan telah dihapus**');
  });
});
