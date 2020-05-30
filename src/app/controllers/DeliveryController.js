import * as Yup from 'yup';
import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import File from '../models/File';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

import NewDeliveryMail from '../jobs/NewDeliveryMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  async index(req, res) {
    const { page = 1, q } = req.query;

    const query = {
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'product',
        'status',
        'created_at',
        'start_date',
        'end_date',
        'canceled_at',
      ],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'city',
            'state',
            'zip_code',
          ],
        },
      ],
    };

    if (q) {
      query.where = {
        product: {
          [Op.iLike]: `%${q}%`,
        },
      };
    }

    const deliveries = await Delivery.finddAll(query);

    return res.json(deliveries);
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

    const delivery = await Delivery.create({
      recipient_id,
      deliveryman_id,
      product,
    });

    // Email to deliveryman
    const deliveryman = await Deliveryman.findByPk(deliveryman_id);
    const recipient = await Recipient.findByPk(recipient_id);

    await Queue.add(NewDeliveryMail.key, {
      deliveryman,
      recipient,
      product,
    });

    return res.json(delivery);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
      product: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails' });
    }

    const { recipient_id, deliveryman_id, product } = req.body;
    const { deliveryId } = req.params;

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery does not exist' });
    }

    if (delivery.start_date) {
      return res
        .status(400)
        .json({ error: "You can't update a started delivery" });
    }

    if (delivery.end_date) {
      return res
        .status(400)
        .json({ error: "You can't update a finished delivery" });
    }

    if (delivery.canceled_at) {
      return res
        .status(400)
        .json({ error: "You can't update a canceled delivery" });
    }

    if (recipient_id && recipient_id !== delivery.recipient_id) {
      const recipient = await Recipient.findByPk(recipient_id);

      if (!recipient) {
        return res.status(400).json({ error: 'Recipient does not exist' });
      }
      delivery.recipient_id = recipient_id;
    }

    if (deliveryman_id && deliveryman_id !== delivery.deliveryman_id) {
      const deliveryman = await Deliveryman.findByPk(deliveryman_id);

      if (!deliveryman) {
        return res.status(400).json({ error: 'Deliveryman does not exist' });
      }
      delivery.deliveryman_id = deliveryman_id;
    }

    if (product && product !== delivery.product) {
      delivery.product = product;
    }

    await delivery.save();

    return res.status(200).json(delivery);
  }

  async delete(req, res) {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery does not exist' });
    }

    if (delivery.start_date) {
      return res
        .status(400)
        .json({ error: "You can't delete a started delivery" });
    }

    if (delivery.end_date) {
      return res
        .status(400)
        .json({ error: "You can't delete a finished delivery" });
    }

    if (delivery.canceled_at) {
      return res
        .status(400)
        .json({ error: "You can't delete a canceled delivery" });
    }

    await delivery.destroy();

    return res.status(204).json();
  }
}

export default new DeliveryController();
