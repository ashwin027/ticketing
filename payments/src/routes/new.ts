import { BadRequestError, NotAuthorizedError, NotFoundError, OrderStatus, requireAuth, validateRequest } from '@aktickets027/common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { natsWrapper } from '../nats-wrapper';
import { stripe } from '../stripe';

const router = express.Router();
router.post('/api/payments', requireAuth, [
    body('token')
        .not()
        .isEmpty()
        .withMessage('Token must be provided.'),
    body('orderId')
        .not()
        .isEmpty()
        .withMessage('Order ID must be provided.')
], validateRequest, async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
        throw new BadRequestError("Cannot pay for a cancelled order.");
    }

    // Charge the card
    const charge = await stripe.charges.create({
        amount: order.price * 100,
        currency: 'cad',
        source: token,
        description: 'My First Test Charge.',
    });

    // Save the payment
    const payment = Payment.build({
        orderId,
        stripeId: charge.id
    });
    await payment.save();

    // publish payment created event
    await new PaymentCreatedPublisher(natsWrapper.client).publish({
        id: payment.id,
        orderId: payment.orderId,
        stripeId: payment.stripeId
    });

    res.status(201).send({id: payment.id});
});

export { router as createChargeRouter };