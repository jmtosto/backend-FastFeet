import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';

class CompletedDeliveryController {
  async update(req, res) {
    const schema = Yup.object().shape({
      deliveryman_id: Yup.number().required(),
      signature_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { deliveryId } = req.params;
    const { deliveryman_id, signature_id } = req.body;
    const delivery = await Delivery.findByPk(deliveryId);

    // Query
    const query = {
      attibrutes: ['id', 'product', 'start_date', 'end_date', 'signature_id'],
      include: [
        {
          model: Recipient,
          as: 'recipient',
          atributtes: ['id', 'name'],
        },
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name'],
        },
      ],
    };

    // File validation
    const signature = await File.findByPk(signature_id);

    if (!signature) {
      return res.status(400).json({ error: "Signature doesn't exist" });
    }

    delivery.signature_id = signature_id;

    // Delivery validation
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

    const parsedDate = new Date();

    delivery.end_date = parsedDate;

    await delivery.save();

    const feedback = await Delivery.findByPk(deliveryId, query);

    return res.json(feedback);
  }
}

export default new CompletedDeliveryController();
