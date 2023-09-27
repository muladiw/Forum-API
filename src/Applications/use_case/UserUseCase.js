const RegisterUser = require('../../Domains/users/entities/RegisterUser');

class UserUseCase {
  constructor({ userRepository, passwordHash }) {
    this._userRepository = userRepository;
    this._passwordHash = passwordHash;
  }

  async addUser(useCasePayload) {
    const registerUser = new RegisterUser(useCasePayload);
    await this._userRepository.verifyAvailableUsername(registerUser.username);
    registerUser.password = await this._passwordHash.hash(registerUser.password);
    return this._userRepository.addUser(registerUser);
  }
}

module.exports = UserUseCase;
