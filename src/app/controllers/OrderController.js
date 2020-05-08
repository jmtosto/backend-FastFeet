import * as Yup from 'yup';
import Order from '../models/Order';
import File from '../models/File';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

class OrderController {
  async index(req, res) {
    const orders = await Order.findAll();

    return res.json(orders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
      product: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails' });
    }

    const { recipient_id, deliveryman_id, product } = req.body;

    const order = await Order.create({
      recipient_id,
      deliveryman_id,
      product,
    });

    return res.json(order);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      signature_id: Yup.number(),
      canceled_at: Yup.date(),
      start_date: Yup.date(),
      end_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails' });
    }

    if (req.body.signature_id) {
      const { signature_id } = req.body;
      const fileExists = await File.findOne({ where: signature_id });

      if (!fileExists) {
        return res
          .status(400)
          .json({ error: 'You must inform a valid signature' });
      }
    }

    const { id } = req.params;

    const order = await Order.findByPk(id);

    const orderUpdate = await order.update(req.body);

    return res.json(orderUpdate);
  }

  async delete(req, res) {
    return res.json({ delete: true });
  }
}

export default new OrderController();
