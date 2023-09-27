const NewAuthentication = require('../../Domains/authentications/entities/NewAuth');
const RefreshAuth = require('../../Domains/authentications/entities/RefreshAuth');
const UserLogin = require('../../Domains/users/entities/UserLogin');

class AuthenticationUseCase {
  constructor({
    userRepository,
    authenticationRepository,
    passwordHash,
    authenticationTokenManager,
  }) {
    this._authenticationRepository = authenticationRepository;
    this._userRepository = userRepository;
    this._passwordHash = passwordHash;
    this._authenticationTokenManager = authenticationTokenManager;
  }

  async deleteAuthentication(useCasePayload) {
    const { refreshToken } = new RefreshAuth(useCasePayload);
    await this._authenticationRepository.checkAvailabilityToken(refreshToken);
    await this._authenticationRepository.deleteToken(refreshToken);
  }

  async loginUser(useCasePayload) {
    const { username, password } = new UserLogin(useCasePayload);

    const encryptedPassword = await this._userRepository.getPasswordByUsername(username);

    await this._passwordHash.comparePassword(password, encryptedPassword);

    const id = await this._userRepository.getIdByUsername(username);

    const accessToken = await this._authenticationTokenManager
      .createAccessToken({ username, id });
    const refreshToken = await this._authenticationTokenManager
      .createRefreshToken({ username, id });

    const newAuthentication = new NewAuthentication({
      accessToken,
      refreshToken,
    });

    await this._authenticationRepository.addToken(newAuthentication.refreshToken);

    return newAuthentication;
  }

  async logoutUser(useCasePayload) {
    const { refreshToken } = new RefreshAuth(useCasePayload);
    await this._authenticationRepository.checkAvailabilityToken(refreshToken);
    await this._authenticationRepository.deleteToken(refreshToken);
  }

  async refreshAuthentication(useCasePayload) {
    const { refreshToken } = new RefreshAuth(useCasePayload);

    await this._authenticationTokenManager.verifyRefreshToken(refreshToken);
    await this._authenticationRepository.checkAvailabilityToken(refreshToken);

    const { username, id } = await this._authenticationTokenManager.decodePayload(refreshToken);

    return this._authenticationTokenManager.createAccessToken({ username, id });
  }
}

module.exports = AuthenticationUseCase;
