/* eslint-disable no-await-in-loop */
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const pool = require('../../database/postgres/pool');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AddComment = require('../../../Domains/threads/entities/AddComment');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const InvariantError = require('../../../Commons/exceptions/InvariantError');
const DetailComment = require('../../../Domains/threads/entities/DetailComment');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  const owner = 'user-321';
  const username = 'username';
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({
      id: owner,
      username,
    });
  });

  describe('addThread function', () => {
    it('should persist add thread and return added thread correctly', async () => {
      // Arrange
      const addThread = new AddThread({
        title: 'sebuah thread',
        body: 'sebuah body thread',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await threadRepositoryPostgres.addThread(owner, addThread);

      // Assert
      const thread = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(thread).toHaveLength(1);
    });
  });

  describe('getThreadById function', () => {
    it('should persist get thread by id and return thread detail correctly', async () => {
      // Arrange
      const addThread = {
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      };
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: addThread.id,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });

      // Action
      const thread = await threadRepositoryPostgres.getThreadById(addThread.id);

      // Assert
      expect(thread.id).toEqual(addThread.id);
      expect(thread.title).toEqual(addThread.title);
      expect(thread.body).toEqual(addThread.body);
      expect(thread.date).toBeDefined();
      expect(thread.username).toEqual(username);
    });
  });

  describe('addComment function', () => {
    it('should persist add comment and return added comment correctly', async () => {
      // Arrange
      const addComment = new AddComment({
        content: 'sebuah content',
      });
      const threadId = 'thread-123';
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await threadRepositoryPostgres.addComment(owner, threadId, addComment);

      // Assert
      const comment = await ThreadsTableTestHelper.findCommentsById('comment-123');
      expect(comment).toHaveLength(1);
    });
  });

  describe('softDeleteCommentByCommentId function', () => {
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    let mockComment = {};
    beforeEach(async () => {
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });

      mockComment = {
        id: commentId,
        threadId,
        content: 'sebuah comment',
        owner,
      };

      // add comment
      await ThreadsTableTestHelper.addComment(mockComment);
    });

    it('should throw NotFoundError if id not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, null);

      // Action & Assert
      await expect(threadRepositoryPostgres.softDeleteCommentByCommentId('xxx'))
        .rejects.toThrow(NotFoundError);
    });

    it('should persist delete comment correctly', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      await threadRepositoryPostgres.softDeleteCommentByCommentId(commentId);

      // Assert
      const comments = await ThreadsTableTestHelper.findCommentsById(commentId);
      const comment = comments[0];
      expect(comment.id).toEqual(commentId);
      expect(comment.date).toBeDefined();
      expect(comment.content).toEqual(mockComment.content);
      expect(comment.owner).toEqual(mockComment.owner);
      expect(comment.thread_id).toEqual(mockComment.threadId);
      expect(comment.is_delete).toEqual(true);
    });
  });

  describe('verifyCommentOwner function', () => {
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    let mockComment = {};
    beforeEach(async () => {
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });

      mockComment = {
        id: commentId,
        threadId,
        content: 'sebuah comment',
        owner,
      };

      // add thread
      await ThreadsTableTestHelper.addComment(mockComment);
    });

    it('should throw AuthorizationError if owner not available', async () => {
      // Arrange
      const mockOwner = 'user-111';

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, null);

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyCommentOwner(mockOwner, threadId, commentId))
        .rejects.toThrow(AuthorizationError);
    });

    it('should throw NotFoundError if id not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, null);

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyCommentOwner(mockComment.owner, threadId, 'xxx'))
        .rejects.toThrow(NotFoundError);
    });

    it('should persist verify comment id correctly', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, null);

      // Action & Assert
      await expect(threadRepositoryPostgres
        .verifyCommentOwner(mockComment.owner, threadId, commentId))
        .resolves.not.toThrow(NotFoundError);
      await expect(threadRepositoryPostgres
        .verifyCommentOwner(mockComment.owner, threadId, commentId))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('getCommentsByThreadId function', () => {
    afterAll(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    let addThread = {};
    let addComments = [];
    beforeEach(async () => {
      // add thread
      addThread = { id: 'thread-123', owner };
      await ThreadsTableTestHelper.addThread(addThread);
      // add comment
      addComments = [
        {
          id: 'comment-123', owner, threadId: addThread.id, date: new Date('2023-01-02'),
        },
        {
          id: 'comment-124', owner, threadId: addThread.id, date: new Date('2023-01-01'),
        },
        {
          id: 'comment-125', owner, threadId: addThread.id, date: new Date('2023-01-03'),
        },
      ];
      await ThreadsTableTestHelper.addComment(addComments[0]);
    });
    it('should persist get comments by thread id and return comments detail correctly', async () => {
      // Arrange
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const comments = await threadRepositoryPostgres.getCommentsByThreadId(addThread.id);

      // Assert
      expect(comments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            content: expect.any(String),
            date: expect.any(Date),
            username: expect.any(String),
          }),
        ]),
      );
      expect(comments).toStrictEqual([
        new DetailComment({
          id: 'comment-123', username, threadId: addThread.id, date: new Date('2023-01-02'), content: 'sebuah komen',
        }),
      ]);
    });

    it('should persist get comments by thread id and return deleted comments correctly', async () => {
      // Arrange
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      await threadRepositoryPostgres.softDeleteCommentByCommentId(addComments[0].id);

      // Action
      const comments = await threadRepositoryPostgres.getCommentsByThreadId(addThread.id);

      // Assert
      expect(comments[0].content).toEqual('**komentar telah dihapus**');
    });

    it('should persist get comments by thread id with ascesding date', async () => {
      // Arrange
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // add comment
      await ThreadsTableTestHelper.addComment(addComments[1]);

      // add comment
      await ThreadsTableTestHelper.addComment(addComments[2]);

      // Action
      const comments = await threadRepositoryPostgres.getCommentsByThreadId(addThread.id);

      // Assert
      expect(comments).toHaveLength(3);
      addComments.sort((a, b) => a.date - b.date);
      for (let i = 0; i < comments.length; i += 1) {
        const item = comments[i];

        expect(item.date).toEqual(addComments[i].date);
      }
    });
  });

  describe('verifyAvailableComment function', () => {
    let addThread = {};
    let addComment = {};
    beforeEach(async () => {
      addThread = {
        id: 'thread-123',
        owner,
      };
      await ThreadsTableTestHelper.addThread(addThread);

      addComment = {
        id: 'comment-123',
        content: 'sebuah komentar',
        owner,
        threadId: addThread.id,
      };
      await ThreadsTableTestHelper.addComment(addComment);
    });

    it('should throw NotFoundError when comment not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyAvailableComment('xxx', 'xxx'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw InvariantError and NotFoundError when comment available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres
        .verifyAvailableComment(addThread.id, addComment.id))
        .resolves.not.toThrowError(InvariantError);
      await expect(threadRepositoryPostgres
        .verifyAvailableComment(addThread.id, addComment.id))
        .resolves.not.toThrowError(NotFoundError);
    });

    it('should throw InvariantError when comment not available', async () => {
      // Arrange
      // add replay
      const addReply = {
        id: 'reply-123',
        content: 'sebuah balasan',
        commentId: addComment.id,
        threadId: addThread.id,
        owner,
      };
      await ThreadsTableTestHelper.addComment(addReply);
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres
        .verifyAvailableComment(addThread.id, addReply.id))
        .rejects.toThrowError(InvariantError);
    });
  });

  describe('addReply function', () => {
    it('should persist add reply and return added reply correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });
      // add comment
      const addComment = {
        id: 'comment-123',
        content: 'sebuah komentar',
        owner,
      };
      await ThreadsTableTestHelper.addComment(addComment);
      const addReply = new AddComment({
        content: 'sebuah balasan',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await threadRepositoryPostgres.addReply(owner, threadId, addComment.id, addReply);

      // Assert
      const reply = await ThreadsTableTestHelper.findCommentsById('reply-123');
      expect(reply).toHaveLength(1);
    });
  });

  describe('getReplies function', () => {
    afterAll(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    let addThread = {};
    let addComment = {};
    let addReplies = [];
    beforeEach(async () => {
      // add thread
      addThread = { id: 'thread-123', owner };
      await ThreadsTableTestHelper.addThread(addThread);
      // add comment
      addComment = {
        id: 'comment-123', owner, threadId: addThread.id, date: new Date('2023-01-02'),
      };
      await ThreadsTableTestHelper.addComment(addComment);

      // add reply
      addReplies = [
        {
          id: 'reply-123', owner, threadId: addThread.id, date: new Date('2023-01-02'), commentId: addComment.id, content: 'sebuah balasan',
        },
        {
          id: 'reply-124', owner, threadId: addThread.id, date: new Date('2023-01-01'), commentId: addComment.id,
        },
        {
          id: 'reply-125', owner, threadId: addThread.id, date: new Date('2023-01-03'), commentId: addComment.id,
        },
      ];
      await ThreadsTableTestHelper.addComment(addReplies[0]);
    });

    it('should persist get replies and return replies detail correctly', async () => {
      // Arrange
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const replies = await threadRepositoryPostgres.getReplies(addThread.id, addComment.id);

      // Assert
      expect(replies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            content: expect.any(String),
            date: expect.any(Date),
            username: expect.any(String),
          }),
        ]),
      );

      expect(replies).toStrictEqual([
        new DetailComment({
          id: 'reply-123', username, threadId: addThread.id, date: new Date('2023-01-02'), content: 'sebuah balasan',
        }),
      ]);
    });

    it('should persist get comments by thread id with ascesding date', async () => {
      // Arrange
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // add comment
      await ThreadsTableTestHelper.addComment(addReplies[1]);

      // add comment
      await ThreadsTableTestHelper.addComment(addReplies[2]);

      // Action
      const replies = await threadRepositoryPostgres.getReplies(addThread.id, addComment.id);

      // Assert
      expect(replies).toHaveLength(3);
      addReplies.sort((a, b) => a.date - b.date);
      for (let i = 0; i < replies.length; i += 1) {
        const item = replies[i];

        expect(item.date).toEqual(addReplies[i].date);
      }
    });
  });

  describe('verifyReplyOwner function', () => {
    let addThread = {};
    let addComment = {};
    beforeEach(async () => {
      // add thread

      addThread = {
        id: 'thread-123',
        owner,
      };
      await ThreadsTableTestHelper.addThread(addThread);

      // add comment
      addComment = {
        id: 'comment-123',
        content: 'sebuah komentar',
        owner,
        threadId: addThread.id,
      };
      await ThreadsTableTestHelper.addComment(addComment);
    });

    it('should not throw NotFoundError when reply doesnt exists', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyReplyOwner('xxx', 'xxx', 'xxx', 'xxx'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw AuthorizationError and NotFoundError when reply exist', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // add reply
      const addReply = {
        id: 'reply-123',
        content: 'sebuah balasan',
        owner,
        threadId: addThread.id,
        commentId: addComment.id,
      };
      await ThreadsTableTestHelper.addComment(addReply);

      // Action & Assert
      await expect(threadRepositoryPostgres
        .verifyReplyOwner(owner, addThread.id, addComment.id, addReply.id))
        .resolves.not.toThrowError(AuthorizationError);
      await expect(threadRepositoryPostgres
        .verifyReplyOwner(owner, addThread.id, addComment.id, addReply.id))
        .resolves.not.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when reply not authorize', async () => {
      // Arrange
      // add replay
      const addReply = {
        id: 'reply-123',
        content: 'sebuah balasan',
        commentId: addComment.id,
        threadId: addThread.id,
        owner,
      };
      await ThreadsTableTestHelper.addComment(addReply);
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres
        .verifyReplyOwner('xxx', addThread.id, addComment.id, addReply.id))
        .rejects.toThrowError(AuthorizationError);
    });
  });

  describe('softDeleteReplyByReplyId function', () => {
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    let mockComment = {};
    beforeEach(async () => {
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });

      mockComment = {
        id: commentId,
        threadId,
        content: 'sebuah comment',
        owner,
      };

      // add comment
      await ThreadsTableTestHelper.addComment(mockComment);
    });

    it('should throw NotFoundError if id not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, null);

      // Action & Assert
      await expect(threadRepositoryPostgres.softDeleteReplyByReplyId('xxx'))
        .rejects.toThrow(NotFoundError);
    });

    it('should persist delete reply correctly', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      const mockReply = {
        id: 'reply-123',
        threadId,
        content: 'sebuah balasan',
        owner,
        commentId,
      };

      // add reply
      await ThreadsTableTestHelper.addComment(mockReply);

      // Action
      await threadRepositoryPostgres.softDeleteReplyByReplyId(mockReply.id);

      // Assert
      const replies = await ThreadsTableTestHelper.findCommentsById(mockReply.id);
      const reply = replies[0];
      expect(reply.id).toEqual(mockReply.id);
      expect(reply.date).toBeDefined();
      expect(reply.content).toEqual(mockReply.content);
      expect(reply.owner).toEqual(mockReply.owner);
      expect(reply.thread_id).toEqual(mockReply.threadId);
      expect(reply.is_delete).toEqual(true);
    });
  });

  describe('addCommentLike function', () => {
    it('should persist add like', async () => {
      // Arrange
      const threadId = 'thread-123';
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });
      // add comment
      const addComment = {
        id: 'comment-123',
        content: 'sebuah komentar',
        owner,
      };
      await ThreadsTableTestHelper.addComment(addComment);
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await threadRepositoryPostgres.addCommentLike(owner, addComment.id);

      // Assert
      const commentLike = await ThreadsTableTestHelper.findCommentLikeById('comment-like-123');
      expect(commentLike).toHaveLength(1);
    });
  });

  describe('verifyAvailableCommentLike function', () => {
    it('should throw NotFoundError when comment like not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyAvailableCommentLike('xxx', 'xxx'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when comment available', async () => {
      // Arrange
      // add comment
      const addComment = {
        id: 'comment-123',
        content: 'sebuah komentar',
        owner,
      };
      await ThreadsTableTestHelper.addComment(addComment);
      await ThreadsTableTestHelper.addCommentLike({
        id: 'comment-like-123',
        commentId: addComment.id,
        userId: owner,
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres
        .verifyAvailableCommentLike(owner, addComment.id))
        .resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('deleteCommentLikeByCommentLikeId function', () => {
    it('should throw NotFoundError if id not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, null);

      // Action & Assert
      await expect(threadRepositoryPostgres.deleteCommentLikeByCommentLikeId('xxx'))
        .rejects.toThrow(NotFoundError);
    });

    it('should persist delete comment like correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });

      const mockComment = {
        id: commentId,
        threadId,
        content: 'sebuah comment',
        owner,
      };

      // add comment
      await ThreadsTableTestHelper.addComment(mockComment);

      // add comment like
      await ThreadsTableTestHelper.addCommentLike({
        id: 'comment-like-123',
        commentId: mockComment.id,
        userId: owner,
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      await threadRepositoryPostgres.deleteCommentLikeByCommentLikeId('comment-like-123');

      // Assert
      const commentLike = await ThreadsTableTestHelper.findCommentLikeById('comment-like-123');
      expect(commentLike).toHaveLength(0);
    });
  });

  describe('countCommentLikeByCommentId function', () => {
    it('should persist count comment likes by commentId and return counted correctly', async () => {
      // Arrange
      const commentId = 'comment-123';
      const addThread = {
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      };
      // add thread
      await ThreadsTableTestHelper.addThread({
        id: addThread.id,
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner,
      });

      const mockComment = {
        id: commentId,
        threadId: addThread.id,
        content: 'sebuah comment',
        owner,
      };

      // add comment
      await ThreadsTableTestHelper.addComment(mockComment);

      // add comment like
      await ThreadsTableTestHelper.addCommentLike({
        id: 'comment-like-123',
        commentId: mockComment.id,
        userId: owner,
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const countComment = await threadRepositoryPostgres
        .countCommentLikeByCommentId(mockComment.id);

      // Assert
      expect(countComment.countLike).toEqual(1);
    });
  });
});
