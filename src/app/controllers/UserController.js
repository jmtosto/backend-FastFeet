import User from '../models/User';

class UserController {
  async store(req, res) {
    const { id, name, email, provider } = await User.create(req.body);

    const user = {
      id,
      name,
      email,
      provider,
    };

    return res.json(user);
  }

  async update(req, res) {
    const { name, email } = req.body;

    const user = await User.map(email => );

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }
}

export default new UserController();
