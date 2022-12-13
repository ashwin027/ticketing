import { BadRequestError, NotAuthorizedError, NotFoundError, OrderStatus, requireAuth } from '@aktickets027/common';
import express, { Request, Response } from 'express';
import { OrderCancelledPublisher } from '../events/publishers/order-cancelled-publisher';
import { Order } from '../models/order';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.delete('/api/orders/:orderId', requireAuth, async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.orderId).populate('ticket');

    if (!order) {
        throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError();
    }

    if (order.status===OrderStatus.Complete){
        throw new BadRequestError("Cannot cancel a completed order.");
    }

    order.status = OrderStatus.Cancelled;
    await order.save();

    // Publish an event saying the event was cancelled
    await new OrderCancelledPublisher(natsWrapper.client).publish({
        id: order.id,
        version: order.version,
        ticket:{
            id: order.ticket.id
        }
    });
    
    res.status(204).send(order);
});

export { router as deleteOrderRouter };