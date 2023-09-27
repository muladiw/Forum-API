const AuthenticationRepository = require('../../../Domains/authentications/AuthenticationRepository');
const NewAuth = require('../../../Domains/authentications/entities/NewAuth');
const UserRepository = require('../../../Domains/users/UserRepository');
const AuthenticationTokenManager = require('../../security/AuthenticationTokenManager');
const PasswordHash = require('../../security/PasswordHash');
const AuthenticationUseCase = require('../AuthenticationUseCase');

describe('AuthenticationUseCase', () => {
  describe('DeleteAuthentication', () => {
    it('should throw error if use case payload not contain refresh token', async () => {
      // Arrange
      const useCasePayload = {};
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(authenticationUseCase.deleteAuthentication(useCasePayload)).rejects.toThrowError('REFRESH_AUTH.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error if refresh token not string', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 123,
      };
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(authenticationUseCase.deleteAuthentication(useCasePayload)).rejects.toThrowError('REFRESH_AUTH.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should orchestrating the delete authentication action correctly', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 'refreshToken',
      };
      const mockAuthenticationRepository = new AuthenticationRepository();
      mockAuthenticationRepository.checkAvailabilityToken = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationRepository.deleteToken = jest.fn()
        .mockImplementation(() => Promise.resolve());

      const authenticationUseCase = new AuthenticationUseCase({
        authenticationRepository: mockAuthenticationRepository,
      });

      // Action
      await authenticationUseCase.deleteAuthentication(useCasePayload);

      // Assert
      expect(mockAuthenticationRepository.checkAvailabilityToken)
        .toHaveBeenCalledWith(useCasePayload.refreshToken);
      expect(mockAuthenticationRepository.deleteToken)
        .toHaveBeenCalledWith(useCasePayload.refreshToken);
    });
  });

  describe('LoginUser', () => {
    it('should orchestrating the get authentication action correctly', async () => {
      // Arrange
      const useCasePayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const mockedAuthentication = new NewAuth({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
      const mockUserRepository = new UserRepository();
      const mockAuthenticationRepository = new AuthenticationRepository();
      const mockAuthenticationTokenManager = new AuthenticationTokenManager();
      const mockPasswordHash = new PasswordHash();

      // Mocking
      mockUserRepository.getPasswordByUsername = jest.fn()
        .mockImplementation(() => Promise.resolve('encrypted_password'));
      mockPasswordHash.comparePassword = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationTokenManager.createAccessToken = jest.fn()
        .mockImplementation(() => Promise.resolve(mockedAuthentication.accessToken));
      mockAuthenticationTokenManager.createRefreshToken = jest.fn()
        .mockImplementation(() => Promise.resolve(mockedAuthentication.refreshToken));
      mockUserRepository.getIdByUsername = jest.fn()
        .mockImplementation(() => Promise.resolve('user-123'));
      mockAuthenticationRepository.addToken = jest.fn()
        .mockImplementation(() => Promise.resolve());

      // create use case instance
      const authenticationUseCase = new AuthenticationUseCase({
        userRepository: mockUserRepository,
        authenticationRepository: mockAuthenticationRepository,
        authenticationTokenManager: mockAuthenticationTokenManager,
        passwordHash: mockPasswordHash,
      });

      // Action
      const actualAuthentication = await authenticationUseCase.loginUser(useCasePayload);

      // Assert
      expect(actualAuthentication).toEqual(new NewAuth({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      }));
      expect(mockUserRepository.getPasswordByUsername)
        .toBeCalledWith('dicoding');
      expect(mockPasswordHash.comparePassword)
        .toBeCalledWith('secret', 'encrypted_password');
      expect(mockUserRepository.getIdByUsername)
        .toBeCalledWith('dicoding');
      expect(mockAuthenticationTokenManager.createAccessToken)
        .toBeCalledWith({ username: 'dicoding', id: 'user-123' });
      expect(mockAuthenticationTokenManager.createRefreshToken)
        .toBeCalledWith({ username: 'dicoding', id: 'user-123' });
      expect(mockAuthenticationRepository.addToken)
        .toBeCalledWith(mockedAuthentication.refreshToken);
    });
  });

  describe('LogoutUser', () => {
    it('should throw error if use case payload not contain refresh token', async () => {
      // Arrange
      const useCasePayload = {};
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(authenticationUseCase.logoutUser(useCasePayload))
        .rejects
        .toThrowError('REFRESH_AUTH.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error if refresh token not string', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 123,
      };
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(authenticationUseCase.logoutUser(useCasePayload))
        .rejects
        .toThrowError('REFRESH_AUTH.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should orchestrating the delete authentication action correctly', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 'refreshToken',
      };
      const mockAuthenticationRepository = new AuthenticationRepository();
      mockAuthenticationRepository.checkAvailabilityToken = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationRepository.deleteToken = jest.fn()
        .mockImplementation(() => Promise.resolve());

      const authenticationUseCase = new AuthenticationUseCase({
        authenticationRepository: mockAuthenticationRepository,
      });

      // Action
      await authenticationUseCase.logoutUser(useCasePayload);

      // Assert
      expect(mockAuthenticationRepository.checkAvailabilityToken)
        .toHaveBeenCalledWith(useCasePayload.refreshToken);
      expect(mockAuthenticationRepository.deleteToken)
        .toHaveBeenCalledWith(useCasePayload.refreshToken);
    });
  });

  describe('RefreshAuthentication', () => {
    it('should throw error if use case payload not contain refresh token', async () => {
      // Arrange
      const useCasePayload = {};
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(authenticationUseCase.refreshAuthentication(useCasePayload))
        .rejects
        .toThrowError('REFRESH_AUTH.NOT_CONTAIN_NEEDED_PROPERTY');
    });

    it('should throw error if refresh token not string', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 1,
      };
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(authenticationUseCase.refreshAuthentication(useCasePayload))
        .rejects
        .toThrowError('REFRESH_AUTH.NOT_MEET_DATA_TYPE_SPECIFICATION');
    });

    it('should orchestrating the refresh authentication action correctly', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 'some_refresh_token',
      };
      const mockAuthenticationRepository = new AuthenticationRepository();
      const mockAuthenticationTokenManager = new AuthenticationTokenManager();
      // Mocking
      mockAuthenticationRepository.checkAvailabilityToken = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationTokenManager.verifyRefreshToken = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationTokenManager.decodePayload = jest.fn()
        .mockImplementation(() => Promise.resolve({ username: 'dicoding', id: 'user-123' }));
      mockAuthenticationTokenManager.createAccessToken = jest.fn()
        .mockImplementation(() => Promise.resolve('some_new_access_token'));
      // Create the use case instance
      const authenticationUseCase = new AuthenticationUseCase({
        authenticationRepository: mockAuthenticationRepository,
        authenticationTokenManager: mockAuthenticationTokenManager,
      });

      // Action
      const accessToken = await authenticationUseCase.refreshAuthentication(useCasePayload);

      // Assert
      expect(mockAuthenticationTokenManager.verifyRefreshToken)
        .toBeCalledWith(useCasePayload.refreshToken);
      expect(mockAuthenticationRepository.checkAvailabilityToken)
        .toBeCalledWith(useCasePayload.refreshToken);
      expect(mockAuthenticationTokenManager.decodePayload)
        .toBeCalledWith(useCasePayload.refreshToken);
      expect(mockAuthenticationTokenManager.createAccessToken)
        .toBeCalledWith({ username: 'dicoding', id: 'user-123' });
      expect(accessToken).toEqual('some_new_access_token');
    });
  });
});
