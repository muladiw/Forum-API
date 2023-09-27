/* eslint-disable no-await-in-loop */
const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const createServer = require('../createServer');
const container = require('../../container');

describe('/threads endpoint', () => {
  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  let accessToken = null;
  let server = null;
  beforeAll(async () => {
    const userPayload = {
      username: 'dicoding',
      password: 'secret',
      fullname: 'Dicoding Indonesia',
    };
    server = await createServer(container);
    // add user
    await server.inject({
      method: 'POST',
      url: '/users',
      payload: userPayload,
    });

    // login user
    const response = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: userPayload.username,
        password: userPayload.password,
      },
    });
    const responseJson = JSON.parse(response.payload);
    // set access token
    accessToken = responseJson.data.accessToken;
  });

  describe('when POST /threads', () => {
    afterEach(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });
    let errorTables = [];
    beforeAll(async () => {
      // set error that wanted to test
      errorTables = [
        {
          payload: { title: 'A Thread', body: 'A Body' },
          message: 'Missing authentication',
          errorCode: 401,
        },
        {
          payload: { title: 'sebuah thread', body: ['sebuah body thread'] },
          message: 'tidak dapat membuat thread baru karena tipe data tidak sesuai',
          accessToken,
        },
        {
          payload: { title: 'sebuah thread' },
          message: 'tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada',
          accessToken,
        },
        {
          payload: {},
          message: 'tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada',
          accessToken,
        },
        {
          payload: { body: 'A Body' },
          message: 'tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada',
          accessToken,
        },
        {
          payload: { title: 123, body: 'A Body' },
          message: 'tidak dapat membuat thread baru karena tipe data tidak sesuai',
          accessToken,
        },
        {
          payload: { title: 'A Thread' },
          message: 'tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada',
          accessToken,
        },
        {
          payload: { title: 'A Thread', body: true },
          message: 'tidak dapat membuat thread baru karena tipe data tidak sesuai',
          accessToken,
        },
      ];
    });
    it('should response 201 and persisted user', async () => {
      // Arrange
      const requestPayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();
      expect(responseJson.data.addedThread.id).toBeDefined();
      expect(responseJson.data.addedThread.title).toBeDefined();
      expect(responseJson.data.addedThread.owner).toBeDefined();
    });

    it('should response 400/401 and show correct message', async () => {
      // Arrange & Action
      for (let i = 0; i < errorTables.length; i += 1) {
        const {
          payload, message, accessToken: token, errorCode,
        } = errorTables[i];

        const response = await server.inject({
          method: 'POST',
          url: '/threads',
          payload,
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(errorCode || 400);
        if (errorCode === 400) expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual(message);
      }
    });
  });

  describe('when POST /threads/{threadId}/comments', () => {
    let errorTables = [];
    let threadId = null;
    afterAll(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    beforeAll(async () => {
      const requestPayload = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // add thread
      const responseThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonThread = JSON.parse(responseThread.payload);
      threadId = responseJsonThread.data.addedThread.id;

      // set error that wanted to test
      errorTables = [
        {
          payload: {},
          message: 'Missing authentication',
          errorCode: 401,
          threadId: 'xxx',
        },
        {
          payload: {},
          message: 'id thread tidak ditemukan di database',
          accessToken,
          errorCode: 404,
          threadId: 'xxx',
        },
        {
          payload: {},
          message: 'tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada',
          accessToken,
          threadId,
        },
        {
          payload: { content: ['A content'] },
          message: 'tidak dapat membuat comment baru karena tipe data tidak sesuai',
          accessToken,
          threadId,
        },
      ];
    });
    it('should response 201 and persisted user', async () => {
      // Arrange
      const requestPayload = {
        content: 'sebuah comment',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();
      expect(responseJson.data.addedComment.id).toBeDefined();
      expect(responseJson.data.addedComment.content).toBeDefined();
      expect(responseJson.data.addedComment.owner).toBeDefined();
    });

    it('should response 400/401 and show correct message', async () => {
      // Arrange & Action
      for (let i = 0; i < errorTables.length; i += 1) {
        const {
          payload, message, accessToken: token, errorCode, threadId: threadIdTest,
        } = errorTables[i];

        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadIdTest}/comments`,
          payload,
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(errorCode || 400);
        if (errorCode === 400) expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual(message);
      }
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    let errorTables = [];
    let threadId = null;
    let commentId = null;
    afterAll(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    beforeAll(async () => {
      const requestPayloadThread = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // add thread
      const responseThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayloadThread,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonThread = JSON.parse(responseThread.payload);
      threadId = responseJsonThread.data.addedThread.id;

      const requestPayloadComment = {
        content: 'sebuah comment',
      };

      // add comment
      const responseComment = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayloadComment,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonComment = JSON.parse(responseComment.payload);
      commentId = responseJsonComment.data.addedComment.id;

      const userPayload = {
        username: 'dicode',
        password: 'secretpass',
        fullname: 'Dicode Indonesia',
      };
      // add user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: userPayload,
      });

      // login user
      const response = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: userPayload.username,
          password: userPayload.password,
        },
      });
      const responseJson = JSON.parse(response.payload);
      // set access token
      const accessToken2 = responseJson.data.accessToken;

      // set error that wanted to test
      errorTables = [
        {
          message: 'Missing authentication',
          errorCode: 401,
          threadId: 'xxx',
          commentId: 'xxx',
        },
        {
          message: 'id comment tidak ditemukan di database',
          accessToken,
          errorCode: 404,
          threadId: 'xxx',
          commentId: 'xxx',
        },
        {
          message: 'Anda tidak berhak mengakses resource ini',
          accessToken: accessToken2,
          errorCode: 403,
          threadId,
          commentId,
        },
      ];
    });

    it('should response 400/401 and show correct message', async () => {
      // Arrange & Action
      for (let i = 0; i < errorTables.length; i += 1) {
        const {
          message,
          accessToken: token,
          errorCode,
          threadId: threadIdTest,
          commentId: commentIdTest,
        } = errorTables[i];

        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadIdTest}/comments/${commentIdTest}`,
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(errorCode || 400);
        if (errorCode === 400) expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual(message);
      }
    });

    it('should response 200 and persisted user', async () => {
      // Arrange & Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });

  describe('when GET /threads/{threadId}', () => {
    let errorTables = [];
    let threadId = null;
    let commentId = null;
    let requestPayloadThread = {};
    let requestPayloadComment = {};
    let requestPayloadReplies = [];
    afterAll(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    beforeAll(async () => {
      requestPayloadThread = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // add thread
      const responseThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayloadThread,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonThread = JSON.parse(responseThread.payload);
      threadId = responseJsonThread.data.addedThread.id;

      requestPayloadComment = {
        content: 'sebuah comment',
      };

      // add comment
      const responseComment = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayloadComment,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonComment = JSON.parse(responseComment.payload);
      commentId = responseJsonComment.data.addedComment.id;

      requestPayloadReplies = [
        {
          content: 'sebuah balasan',
        },
        {
          content: 'sebuah balasan2',
        },
      ];
      for (let i = 0; i < requestPayloadReplies.length; i += 1) {
        const item = requestPayloadReplies[i];
        // add comment
        await server.inject({
          method: 'POST',
          url: `/threads/${threadId}/comments/${commentId}/replies`,
          payload: item,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }

      // set error that wanted to test
      errorTables = [
        {
          message: 'id thread tidak ditemukan di database',
          errorCode: 404,
          threadId: 'xxx',
        },
      ];
    });

    it('should response 400/401 and show correct message', async () => {
      // Arrange & Action
      for (let i = 0; i < errorTables.length; i += 1) {
        const {
          message,
          errorCode,
          threadId: threadIdTest,
        } = errorTables[i];

        const response = await server.inject({
          url: `/threads/${threadIdTest}`,
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(errorCode || 400);
        if (errorCode === 400) expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual(message);
      }
    });

    it('should response 200 and persisted user', async () => {
      // Arrange & Action
      const response = await server.inject({
        url: `/threads/${threadId}`,
      });

      // // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.thread).toBeDefined();
      expect(responseJson.data.thread.id).toStrictEqual(threadId);
      expect(responseJson.data.thread.title).toStrictEqual(requestPayloadThread.title);
      expect(responseJson.data.thread.body).toStrictEqual(requestPayloadThread.body);
      expect(responseJson.data.thread.username).toBeDefined();
      expect(responseJson.data.thread.date).toBeDefined();
      expect(responseJson.data.thread.comments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            content: expect.any(String),
            date: expect.any(String),
            username: expect.any(String),
            replies: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                content: expect.any(String),
                date: expect.any(String),
                username: expect.any(String),
              }),
            ]),
          }),
        ]),
      );
    });

    it('should response 200 and has deleted comment', async () => {
      // Arrange
      await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Action
      const response = await server.inject({
        url: `/threads/${threadId}`,
      });

      // // Assert
      const responseJson = JSON.parse(response.payload);
      expect(responseJson.data.thread.comments[0].content).toEqual('**komentar telah dihapus**');
    });
  });

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    let errorTables = [];
    let threadId = null;
    let commentId = null;
    let requestPayloadThread = {};
    let requestPayloadComment = {};
    afterAll(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    beforeAll(async () => {
      requestPayloadThread = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // add thread
      const responseThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayloadThread,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonThread = JSON.parse(responseThread.payload);
      threadId = responseJsonThread.data.addedThread.id;

      requestPayloadComment = {
        content: 'sebuah comment',
      };

      // add comment
      const responseComment = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayloadComment,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonComment = JSON.parse(responseComment.payload);
      commentId = responseJsonComment.data.addedComment.id;

      // set error that wanted to test
      errorTables = [
        {
          payload: {},
          message: 'Missing authentication',
          errorCode: 401,
          threadId: 'xxx',
          commentId: 'xxx',
        },
        {
          payload: {},
          message: 'id balasan tidak ditemukan di database',
          accessToken,
          errorCode: 404,
          threadId: 'xxx',
          commentId: 'xxx',
        },
        {
          payload: {},
          message: 'tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada',
          accessToken,
          threadId,
          commentId,
        },
        {
          payload: { content: ['A content'] },
          message: 'tidak dapat membuat comment baru karena tipe data tidak sesuai',
          accessToken,
          threadId,
          commentId,
        },
      ];
    });

    it('should response 400/401 and show correct message', async () => {
      // Arrange & Action
      for (let i = 0; i < errorTables.length; i += 1) {
        const {
          message,
          errorCode,
          threadId: threadIdTest,
          commentId: commentIdTest,
          payload,
          accessToken: token,
        } = errorTables[i];

        const response = await server.inject({
          method: 'POST',
          url: `/threads/${threadIdTest}/comments/${commentIdTest}/replies`,
          payload,
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(errorCode || 400);
        if (errorCode === 400) expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual(message);
      }
    });

    it('should response 201 and persisted user', async () => {
      // Arrange
      const requestPayload = {
        content: 'sebuah balasan',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedReply).toBeDefined();
      expect(responseJson.data.addedReply.id).toBeDefined();
      expect(responseJson.data.addedReply.content).toEqual(requestPayload.content);
      expect(responseJson.data.addedReply.owner).toBeDefined();
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    let errorTables = [];
    let threadId = null;
    let commentId = null;
    let replyId = null;
    afterAll(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    beforeAll(async () => {
      const requestPayloadThread = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // add thread
      const responseThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayloadThread,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonThread = JSON.parse(responseThread.payload);
      threadId = responseJsonThread.data.addedThread.id;

      const requestPayloadComment = {
        content: 'sebuah comment',
      };

      // add comment
      const responseComment = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayloadComment,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonComment = JSON.parse(responseComment.payload);
      commentId = responseJsonComment.data.addedComment.id;

      const requestPayloadReply = {
        content: 'sebuah comment',
      };
      // add reply
      const responseReply = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayloadReply,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonReply = JSON.parse(responseReply.payload);
      replyId = responseJsonReply.data.addedReply.id;

      const userPayload = {
        username: 'dicode',
        password: 'secretpass',
        fullname: 'Dicode Indonesia',
      };
      // add user
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: userPayload,
      });

      // login user
      const response = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: userPayload.username,
          password: userPayload.password,
        },
      });
      const responseJson = JSON.parse(response.payload);
      // set access token
      const accessToken2 = responseJson.data.accessToken;

      // set error that wanted to test
      errorTables = [
        {
          message: 'Missing authentication',
          errorCode: 401,
          threadId: 'xxx',
          commentId: 'xxx',
          replyId: 'xxx',
        },
        {
          message: 'id balasan tidak ditemukan di database',
          accessToken,
          errorCode: 404,
          threadId: 'xxx',
          commentId: 'xxx',
          replyId: 'xxx',
        },
        {
          message: 'Anda tidak berhak mengakses resource ini',
          accessToken: accessToken2,
          errorCode: 403,
          threadId,
          commentId,
          replyId,
        },
      ];
    });

    it('should response 400/401 and show correct message', async () => {
      // Arrange & Action
      for (let i = 0; i < errorTables.length; i += 1) {
        const {
          message,
          accessToken: token,
          errorCode,
          threadId: threadIdTest,
          commentId: commentIdTest,
          replyId: replyIdTest,
        } = errorTables[i];

        const response = await server.inject({
          method: 'DELETE',
          url: `/threads/${threadIdTest}/comments/${commentIdTest}/replies/${replyIdTest}`,
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(errorCode || 400);
        if (errorCode === 400) expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual(message);
      }
    });

    it('should response 200 and persisted user', async () => {
      // Arrange & Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseThread = await server.inject({
        url: `/threads/${threadId}`,
      });

      const responseJsonThread = JSON.parse(responseThread.payload);
      expect(responseJsonThread.data.thread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    let errorTables = [];
    let threadId = null;
    let commentId = null;
    afterEach(async () => {
      await ThreadsTableTestHelper.cleanTable();
    });

    beforeEach(async () => {
      const requestPayloadThread = {
        title: 'sebuah thread',
        body: 'sebuah body thread',
      };

      // add thread
      const responseThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayloadThread,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonThread = JSON.parse(responseThread.payload);
      threadId = responseJsonThread.data.addedThread.id;

      const requestPayloadComment = {
        content: 'sebuah comment',
      };

      // add comment
      const responseComment = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayloadComment,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const responseJsonComment = JSON.parse(responseComment.payload);
      commentId = responseJsonComment.data.addedComment.id;

      // set error that wanted to test
      errorTables = [
        {
          message: 'Missing authentication',
          errorCode: 401,
          threadId: 'xxx',
          commentId: 'xxx',
        },
        {
          message: 'id balasan tidak ditemukan di database',
          accessToken,
          errorCode: 404,
          threadId: 'xxx',
          commentId: 'xxx',
        },
      ];
    });

    it('should response 400/401 and show correct message', async () => {
      // Arrange & Action
      for (let i = 0; i < errorTables.length; i += 1) {
        const {
          message,
          accessToken: token,
          errorCode,
          threadId: threadIdTest,
          commentId: commentIdTest,
        } = errorTables[i];

        const response = await server.inject({
          method: 'PUT',
          url: `/threads/${threadIdTest}/comments/${commentIdTest}/likes`,
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        });

        // Assert
        const responseJson = JSON.parse(response.payload);
        expect(response.statusCode).toEqual(errorCode || 400);
        if (errorCode === 400) expect(responseJson.status).toEqual('fail');
        expect(responseJson.message).toEqual(message);
      }
    });

    it('should response 200 and persisted thread detail', async () => {
      // Arrange & Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseThread = await server.inject({
        url: `/threads/${threadId}`,
      });

      const responseJsonThread = JSON.parse(responseThread.payload);
      expect(responseJsonThread.data.thread.comments[0].likeCount).toEqual(1);

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should response 200 with like then dislikes case', async () => {
      // Arrange & Action
      // like comment
      await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseThread = await server.inject({
        url: `/threads/${threadId}`,
      });

      const responseJsonThread = JSON.parse(responseThread.payload);
      expect(responseJsonThread.data.thread.comments[0].likeCount).toEqual(1);

      // dislike comment
      await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseThreadDislike = await server.inject({
        url: `/threads/${threadId}`,
      });

      const responseJsonThreadDislike = JSON.parse(responseThreadDislike.payload);
      expect(responseJsonThreadDislike.data.thread.comments[0].likeCount).toEqual(0);
    });
  });
});
