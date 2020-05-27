import * as Yup from 'yup';
import { Op } from 'sequelize';

import Delivery from '../models/Delivery';
import DeliveryProblem from '../models/DeliveryProblem';
import Deliveryman from '../models/Deliveryman';
import Recipient from '../models/Recipient';

import Mail from '../../lib/Mail';

class DeliveryProblemController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const problems = await DeliveryProblem.findAll();
    const deliveries = [];

    problems.map((problem) => deliveries.push(problem.delivery_id));

    const deliveriesProblem = await Delivery.findAll({
      limit: 5,
      offset: (page - 1) * 5,
      where: {
        id: {
          [Op.in]: deliveries,
        },
      },
    });

    return res.json(deliveriesProblem);
  }

  async show(req, res) {
    const { deliveryId } = req.params;
    const { page = 1, q } = req.query;

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery does not exist' });
    }

    const problems = await DeliveryProblem.findAll({
      limit: 5,
      offset: (page - 1) * 5,
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'status'],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: ['id', 'name', 'state', 'city'],
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      where: {
        delivery_id: deliveryId,
        description: {
          [Op.iLike]: `%${q}%`,
        },
      },
    });

    if (!problems) {
      return res
        .status(400)
        .json({ error: 'There is no problem set for this delivery' });
    }

    return res.json(problems);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      deliveryman_id: Yup.number().required(),
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails' });
    }

    const { deliveryId } = req.params;
    const { deliveryman_id, description } = req.body;

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery does not exist' });
    }

    if (deliveryman_id !== delivery.deliveryman_id) {
      return res.status(400).json({
        error: "You don't have permission to acces this delivery",
      });
    }

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'This delivery is canceled' });
    }

    if (!delivery.start_date) {
      return res
        .status(400)
        .json({ error: 'This delivery has not been started' });
    }

    if (delivery.end_date) {
      return res
        .status(400)
        .json({ error: 'This delivery is already finished' });
    }

    const deliveryProblem = await DeliveryProblem.create({
      delivery_id: deliveryId,
      description,
    });

    return res.json(deliveryProblem);
  }

  async delete(req, res) {
    const { problemId } = req.params;
    const problem = await DeliveryProblem.findByPk(problemId);

    if (!problem) {
      return res.status(400).json({ error: "Problem doesn't exist" });
    }

    const { delivery_id } = problem;

    const delivery = await Delivery.findByPk(delivery_id, {
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
        },
        {
          model: Recipient,
          as: 'recipient',
        },
      ],
    });

    if (delivery.canceled_at) {
      return res.status(400).json({ error: 'This delivery is canceled' });
    }

    if (delivery.end_date) {
      return res
        .status(400)
        .json({ error: 'This delivery is already finished' });
    }

    delivery.canceled_at = new Date();

    await delivery.save();

    // Email to deliveryman
    await Mail.sendMail({
      to: `${delivery.deliveryman.name} <${delivery.deliveryman.email}>`,
      subject: 'Entrega cancelada',
      template: 'cancellation',
      context: {
        deliveryman: delivery.deliveryman.name,
        product: delivery.product,
        recipient: delivery.recipient.name,
      },
    });

    return res.json(delivery);
  }
}

export default new DeliveryProblemController();
