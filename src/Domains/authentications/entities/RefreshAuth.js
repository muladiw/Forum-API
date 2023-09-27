class RefreshAuth {
  constructor(payload) {
    this._verifyPayload(payload);

    this.refreshToken = payload.refreshToken;
  }

  _verifyPayload(payload) {
    const { refreshToken } = payload;

    if (!refreshToken) {
      throw new Error('REFRESH_AUTH.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof refreshToken !== 'string') {
      throw new Error('REFRESH_AUTH.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = RefreshAuth;
