import * as Yup from 'yup';
import Deliveryman from '../models/Deliveryman';

class DeliverymanController {
  async index(req, res) {
    const deliverymen = await Deliveryman.findAll();

    return res.json(deliverymen);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { name, email } = req.body;

    const emailExists = await Deliveryman.findOne({ where: { email } });

    if (emailExists) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    await Deliveryman.create(req.body);

    return res.json({
      name,
      email,
    });
  }

  async update(req, res) {
    return res.json({ update: 'ok' });
  }

  async delete(req, res) {
    const { id } = req.body;

    const deliveryman = await Deliveryman.findOne({ where: { id } });

    if (!deliveryman) {
      return res.status(400).json({ error: 'You must inform a valid id' });
    }

    await deliveryman.delete;

    return res.json({ delete: 'ok' });
  }
}

export default new DeliverymanController();
