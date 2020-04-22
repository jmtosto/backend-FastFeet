import Recipient from '../models/Recipient';

class RecipientController {
  async store(req, res) {
    const {
      name,
      street,
      number,
      complement,
      city,
      state,
      zip_code,
    } = await Recipient.create(req.body);

    const recipient = {
      name,
      street,
      number,
      complement,
      city,
      state,
      zip_code,
    };

    return res.json(recipient);
  }
}

export default new RecipientController();
