const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const ThreadUseCase = require('../ThreadUseCase');
const AddedComment = require('../../../Domains/threads/entities/AddedComment');
const AddComment = require('../../../Domains/threads/entities/AddComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ThreadUseCase', () => {
  /**
   * Menguji apakah use case mampu mengorkestrasikan langkah demi langkah dengan benar.
   */
  describe('Thread', () => {
    it('should orchestrating the add thread action correctly', async () => {
      // Arrange
      const useCasePayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };
      const owner = 'user-321';

      const mockAddedThread = new AddedThread({
        id: 'thread-123',
        title: useCasePayload.title,
        owner,
      });

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.addThread = jest.fn()
        .mockImplementation(() => Promise.resolve(mockAddedThread));

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action
      const addedThread = await threadUseCase.addThread(owner, useCasePayload);

      // Assert
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: useCasePayload.title,
        owner,
      }));

      expect(mockThreadRepository.addThread).toBeCalledWith(owner, new AddThread(useCasePayload));
    });
  });

  describe('Comment', () => {
    it('should orchestrating the add comment action correctly', async () => {
      // Arrange
      const useCasePayload = {
        content: 'sebuah comment',
      };
      const owner = 'user-321';
      const threadId = 'thread-123';

      const mockAddedComment = new AddedComment({
        id: 'comment-123',
        content: useCasePayload.content,
        owner,
      });

      const mockDetailThread = {
        id: 'thread-123',
      };

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.addComment = jest.fn()
        .mockImplementation(() => Promise.resolve(mockAddedComment));
      mockThreadRepository.getThreadById = jest.fn()
        .mockImplementation(() => Promise.resolve(mockDetailThread));

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action
      const addedComment = await threadUseCase.addComment(owner, threadId, useCasePayload);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: useCasePayload.content,
        owner,
      }));

      expect(mockThreadRepository.addComment)
        .toBeCalledWith(owner, threadId, new AddComment(useCasePayload));
      expect(mockThreadRepository.getThreadById)
        .toBeCalledWith('thread-123');
    });

    it('should orchestrating the delete comment action correctly', async () => {
      // Arrange
      const owner = 'user-321';
      const commentId = 'comment-123';
      const threadId = 'thread-123';

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.verifyCommentOwner = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.softDeleteCommentByCommentId = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action
      await threadUseCase
        .deleteCommentByCommentId(owner, threadId, commentId);

      // Assert
      expect(mockThreadRepository.verifyCommentOwner)
        .toBeCalledWith(owner, threadId, commentId);
      expect(mockThreadRepository.softDeleteCommentByCommentId)
        .toBeCalledWith(commentId);
    });

    it('should orchestrating the get detail thread action correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      const mockDetailThread = {
        id: threadId,
        title: 'title',
        body: 'body',
        username: 'username',
        date: new Date('2022-03-25'),
      };
      const mockDetailComments = [
        {
          id: 'comment-123',
          username: 'username',
          date: new Date('2022-03-25'),
          content: 'content',
        },
        {
          id: 'comment-124',
          username: 'username2',
          date: new Date('2022-03-26'),
          content: 'content2',
        },
      ];
      const mockDetailReply = {
        id: 'reply-123',
        username: 'username',
        date: new Date('2022-03-26'),
        content: 'reply',
      };

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.getThreadById = jest.fn()
        .mockImplementation(() => Promise.resolve(mockDetailThread));
      mockThreadRepository.getCommentsByThreadId = jest.fn()
        .mockImplementation(() => Promise.resolve(mockDetailComments));
      mockThreadRepository.getReplies = jest.fn((tId, cId) => {
        let result = [];
        if (tId === 'thread-123' && cId === 'comment-123') result = [mockDetailReply];
        return Promise.resolve(result);
      });
      mockThreadRepository.countCommentLikeByCommentId = jest.fn((cId) => {
        let result = { countLike: 0 };
        if (cId === 'comment-124') result = { countLike: 3 };

        return Promise.resolve(result);
      });

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action
      const threadComment = await threadUseCase.getThreadById(threadId);

      // Assert
      expect(threadComment).toStrictEqual({
        id: mockDetailThread.id,
        title: mockDetailThread.title,
        body: mockDetailThread.body,
        username: mockDetailThread.username,
        date: mockDetailThread.date,
        comments: [
          {
            id: 'comment-123',
            username: 'username',
            date: new Date('2022-03-25'),
            content: 'content',
            likeCount: 0,
            replies: [
              {
                id: 'reply-123',
                username: 'username',
                date: new Date('2022-03-26'),
                content: 'reply',
              },
            ],
          },
          {
            id: 'comment-124',
            username: 'username2',
            date: new Date('2022-03-26'),
            content: 'content2',
            likeCount: 3,
            replies: [],
          },
        ],
      });

      expect(mockThreadRepository.getThreadById)
        .toBeCalledWith(threadId);
      expect(mockThreadRepository.getCommentsByThreadId)
        .toBeCalledWith(threadId);
      expect(mockThreadRepository.getReplies.mock.calls).toHaveLength(2);
      expect(mockThreadRepository.countCommentLikeByCommentId.mock.calls).toHaveLength(2);
      // loop 0
      // param 1
      expect(mockThreadRepository.getReplies.mock.calls[0][0]).toBe(threadId);
      expect(mockThreadRepository.countCommentLikeByCommentId.mock.calls[0][0])
        .toBe(mockDetailComments[0].id);
      // param 2
      expect(mockThreadRepository.getReplies.mock.calls[0][1]).toBe(mockDetailComments[0].id);
      // loop 1
      // param 1
      expect(mockThreadRepository.getReplies.mock.calls[1][0]).toBe(threadId);
      expect(mockThreadRepository.countCommentLikeByCommentId.mock.calls[1][0])
        .toBe(mockDetailComments[1].id);
      // param 2
      expect(mockThreadRepository.getReplies.mock.calls[1][1]).toBe(mockDetailComments[1].id);
    });
  });

  describe('Reply', () => {
    it('should orchestrating the add reply action correctly', async () => {
      // Arrange
      const useCasePayload = {
        content: 'sebuah balasan',
      };
      const owner = 'user-321';
      const threadId = 'thread-123';
      const commentId = 'comment-123';

      const mockAddedReply = new AddedComment({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner,
      });

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.verifyAvailableComment = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.addReply = jest.fn()
        .mockImplementation(() => Promise.resolve(mockAddedReply));

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action
      const addedReply = await threadUseCase
        .addReply(owner, threadId, commentId, useCasePayload);

      // Assert
      expect(addedReply).toStrictEqual(new AddedComment({
        id: 'reply-123',
        content: useCasePayload.content,
        owner,
      }));

      expect(mockThreadRepository.verifyAvailableComment)
        .toBeCalledWith(threadId, 'comment-123');
      expect(mockThreadRepository.addReply)
        .toBeCalledWith(owner, threadId, 'comment-123', new AddComment(useCasePayload));
    });

    it('should orchestrating the delete reply action correctly', async () => {
      // Arrange
      const owner = 'user-321';
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      const replyId = 'reply-123';

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.verifyReplyOwner = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.softDeleteReplyByReplyId = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action
      await threadUseCase
        .deleteReply(owner, threadId, commentId, replyId);

      // Assert
      expect(mockThreadRepository.verifyReplyOwner)
        .toBeCalledWith(owner, threadId, commentId, replyId);
      expect(mockThreadRepository.softDeleteReplyByReplyId)
        .toBeCalledWith(replyId);
    });
  });

  describe('Like comment', () => {
    it('should orchestrating the add comment like action correctly', async () => {
      // Arrange
      const owner = 'user-321';
      const threadId = 'thread-123';
      const commentId = 'comment-123';

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.verifyAvailableComment = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.verifyAvailableCommentLike = jest.fn()
        .mockImplementation(() => Promise.reject(new NotFoundError('id menyukai komentar tidak ditemukan di database')));
      mockThreadRepository.addCommentLike = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.deleteCommentLikeByCommentLikeId = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action
      await threadUseCase.likeComment(owner, threadId, commentId);

      // Assert
      expect(mockThreadRepository.verifyAvailableComment)
        .toBeCalledWith(threadId, commentId);
      expect(mockThreadRepository.verifyAvailableCommentLike)
        .toBeCalledWith(owner, commentId);
      expect(mockThreadRepository.addCommentLike)
        .toBeCalledWith(owner, commentId);
    });

    it('should orchestrating the dislike comment action correctly', async () => {
      // Arrange
      const owner = 'user-321';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const mockCommentLike = { id: 'comment-like-123' };

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.verifyAvailableComment = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.verifyAvailableCommentLike = jest.fn()
        .mockImplementation(() => Promise.resolve(mockCommentLike));
      mockThreadRepository.addCommentLike = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.deleteCommentLikeByCommentLikeId = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action
      await threadUseCase.likeComment(owner, threadId, commentId);

      // Assert
      expect(mockThreadRepository.verifyAvailableComment)
        .toBeCalledWith(threadId, commentId);
      expect(mockThreadRepository.verifyAvailableCommentLike)
        .toBeCalledWith(owner, commentId);
      expect(mockThreadRepository.deleteCommentLikeByCommentLikeId)
        .toBeCalledWith(mockCommentLike.id);
    });

    it('should throw error if repository got error', async () => {
      // Arrange
      const owner = 'user-321';
      const threadId = 'thread-123';
      const commentId = 'comment-123';

      /** creating dependency of use case */
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.verifyAvailableComment = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.verifyAvailableCommentLike = jest.fn()
        .mockImplementation(() => Promise.reject(new Error('error')));
      mockThreadRepository.addCommentLike = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.deleteCommentLikeByCommentLikeId = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({ threadRepository: mockThreadRepository });

      // Action & Assert
      await expect(threadUseCase.likeComment(owner, threadId, commentId))
        .rejects.toThrowError(Error);
    });
  });
});
