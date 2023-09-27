const ThreadUseCase = require('../../../../Applications/use_case/ThreadUseCase');

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postThreadHandler = this.postThreadHandler.bind(this);
    this.postThreadCommentHandler = this.postThreadCommentHandler.bind(this);
    this.deleteThreadCommentHandler = this.deleteThreadCommentHandler.bind(this);
    this.getThreadHandler = this.getThreadHandler.bind(this);
    this.postThreadCommentReplyHandler = this.postThreadCommentReplyHandler.bind(this);
    this.deleteThreadCommentReplyHandler = this.deleteThreadCommentReplyHandler.bind(this);
    this.putLikeCommentHandler = this.putLikeCommentHandler.bind(this);
  }

  async postThreadHandler(request, h) {
    const threadUseCase = this._container.getInstance(ThreadUseCase.name);
    const { id: userId } = request.auth.credentials;
    const addedThread = await threadUseCase.addThread(userId, request.payload);

    const response = h.response({
      status: 'success',
      data: {
        addedThread,
      },
    });
    response.code(201);
    return response;
  }

  async postThreadCommentHandler(request, h) {
    const threadUseCase = this._container.getInstance(ThreadUseCase.name);
    const { id: userId } = request.auth.credentials;
    const { threadId } = request.params;
    const addedComment = await threadUseCase.addComment(userId, threadId, request.payload);

    const response = h.response({
      status: 'success',
      data: {
        addedComment,
      },
    });
    response.code(201);
    return response;
  }

  async deleteThreadCommentHandler(request, h) {
    const threadUseCase = this._container.getInstance(ThreadUseCase.name);
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId } = request.params;
    await threadUseCase.deleteCommentByCommentId(userId, threadId, commentId);

    const response = h.response({
      status: 'success',
    });
    response.code(200);
    return response;
  }

  async getThreadHandler(request, h) {
    const threadUseCase = this._container.getInstance(ThreadUseCase.name);
    const { threadId } = request.params;
    const thread = await threadUseCase.getThreadById(threadId);

    const response = h.response({
      status: 'success',
      data: {
        thread,
      },
    });
    response.code(200);
    return response;
  }

  async postThreadCommentReplyHandler(request, h) {
    const threadUseCase = this._container.getInstance(ThreadUseCase.name);
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId } = request.params;
    const addedReply = await threadUseCase.addReply(userId, threadId, commentId, request.payload);

    const response = h.response({
      status: 'success',
      data: {
        addedReply,
      },
    });
    response.code(201);
    return response;
  }

  async deleteThreadCommentReplyHandler(request, h) {
    const threadUseCase = this._container.getInstance(ThreadUseCase.name);
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId, replyId } = request.params;
    await threadUseCase.deleteReply(userId, threadId, commentId, replyId);

    const response = h.response({
      status: 'success',
    });
    response.code(200);
    return response;
  }

  async putLikeCommentHandler(request, h) {
    const threadUseCase = this._container.getInstance(ThreadUseCase.name);
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId } = request.params;
    await threadUseCase.likeComment(userId, threadId, commentId);

    const response = h.response({
      status: 'success',
    });
    response.code(200);
    return response;
  }
}

module.exports = ThreadsHandler;
