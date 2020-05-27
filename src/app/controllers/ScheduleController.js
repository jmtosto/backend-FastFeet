import { Op } from 'sequelize';
import * as Yup from 'yup';
import { startOfDay, endOfDay } from 'date-fns';

import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';

class ScheduleController {
  async index(req, res) {
    const { page = 1, status } = req.query;
    const { deliverymanId } = req.params;

    const deliveryman = await Deliveryman.findByPk(deliverymanId);

    if (!deliveryman) {
      return res.status(400).json({ error: "Deliveryman doesn't exist" });
    }

    const query = {
      order: [['created_at', 'DESC']],
      atributtes: ['id', 'product', 'status', 'created_at', 'start_date'],
      limit: 10,
      offset: (page - 1) * 10,
      where: { status },
      include: [
        {
          model: Recipient,
          as: 'recipient',
          atributtes: [
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
        {
          model: Deliveryman,
          as: 'deliveryman',
          atributtes: ['id', 'name', 'email'],
          where: { id: deliverymanId },
        },
      ],
    };

    if (status === 'entregue') {
      query.where = {
        canceled_at: null,
        end_date: {
          [Op.ne]: null,
        },
      };
    } else {
      query.where = {
        canceled_at: null,
        end_date: null,
      };
    }

    const deliveries = await Delivery.findAll(query);

    return res.json(deliveries);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { deliveryId } = req.params;
    const { deliveryman_id } = req.body;

    const delivery = await Delivery.findByPk(deliveryId, {
      attibrutes: ['id', 'product', 'created_at'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          atributtes: [
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
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!delivery) {
      return res.status(400).json({ error: "Delivery doesn't exist" });
    }

    if (deliveryman_id !== delivery.deliveryman_id) {
      return res
        .status(400)
        .json({ error: "You don't have permission to start this delivery" });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'This delivery is canceled' });
    }

    if (delivery.start_date) {
      return res
        .status(400)
        .json({ error: 'This delivery is already started' });
    }

    if (delivery.end_date) {
      return res
        .status(400)
        .json({ error: 'This delivery is already finished' });
    }

    const parsedDate = new Date();

    const deliveries = await Delivery.findAll({
      where: {
        start_date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
    });

    if (deliveries.length >= 5) {
      return res.status(400).json({
        error:
          'You have already started 5 deliveries today, you must wait untill tomorrow to start more deliveries',
      });
    }

    delivery.start_date = parsedDate;

    const {
      id,
      product,
      start_date,
      recipient,
      status,
    } = await delivery.save();

    return res.json({
      id,
      product,
      start_date,
      recipient,
      status,
    });
  }
}

export default new ScheduleController();
