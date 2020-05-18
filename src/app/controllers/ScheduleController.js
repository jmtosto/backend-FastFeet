import { Op } from 'sequelize';

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
}

export default new ScheduleController();
