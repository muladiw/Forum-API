/* eslint-disable no-await-in-loop */
const AddThread = require('../../Domains/threads/entities/AddThread');
const AddComment = require('../../Domains/threads/entities/AddComment');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class ThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  addThread(owner, useCasePayload) {
    const addThread = new AddThread(useCasePayload);
    return this._threadRepository.addThread(owner, addThread);
  }

  async addComment(owner, threadId, useCasePayload) {
    await this._threadRepository.getThreadById(threadId);
    const addComment = new AddComment(useCasePayload);
    return this._threadRepository.addComment(owner, threadId, addComment);
  }

  async deleteCommentByCommentId(owner, threadId, commentId) {
    await this._threadRepository.verifyCommentOwner(owner, threadId, commentId);
    await this._threadRepository.softDeleteCommentByCommentId(commentId);
  }

  async getThreadById(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const resultComments = await this._threadRepository.getCommentsByThreadId(threadId);
    const comments = [];
    for (let i = 0; i < resultComments.length; i += 1) {
      const item = resultComments[i];

      const replies = await this._threadRepository.getReplies(threadId, item.id);
      const likeCount = await this._threadRepository.countCommentLikeByCommentId(item.id);
      comments.push({ ...item, replies, likeCount: likeCount.countLike });
    }
    return { ...thread, comments };
  }

  async addReply(owner, threadId, commentId, useCasePayload) {
    await this._threadRepository.verifyAvailableComment(threadId, commentId);
    const addReply = new AddComment(useCasePayload);
    return this._threadRepository.addReply(owner, threadId, commentId, addReply);
  }

  async deleteReply(owner, threadId, commentId, replyId) {
    await this._threadRepository.verifyReplyOwner(owner, threadId, commentId, replyId);
    await this._threadRepository.softDeleteReplyByReplyId(replyId);
  }

  async likeComment(userId, threadId, commentId) {
    await this._threadRepository.verifyAvailableComment(threadId, commentId);
    let result;
    try {
      result = await this._threadRepository.verifyAvailableCommentLike(userId, commentId);
      await this._threadRepository.deleteCommentLikeByCommentLikeId(result.id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        await this._threadRepository.addCommentLike(userId, commentId);
      } else throw error;
    }
  }
}

module.exports = ThreadUseCase;
