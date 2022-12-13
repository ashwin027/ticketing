import { BadRequestError, NotFoundError, OrderStatus, requireAuth, validateRequest } from '@aktickets027/common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { Order } from '../models/order';
import { Ticket } from '../models/ticket';
import { natsWrapper } from '../nats-wrapper';


const router = express.Router();
const EXPIRATION_WINDOW_SECONDS = 1 * 60;

router.post('/api/orders', requireAuth, [
    body('ticketId')
        .not()
        .isEmpty()
        .withMessage('TicketId must be provided.')
], validateRequest, async (req: Request, res: Response) => {
    const {ticketId}  = req.body;

    // Find the ticket the user is trying to order in the database
    const ticket = await Ticket.findById(ticketId);

    if (!ticket){
        throw new NotFoundError();
    }

    // Make sure the ticket is not already reserved
    const isReserved = await ticket.isReserved();
    if (isReserved){
        throw new BadRequestError("Ticket is already reserved.");
    }

    // Calculate an expiration date for this order
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    // Build the order and save it to the database
    const order = Order.build({
        userId: req.currentUser!.id,
        expiresAt: expiration,
        status: OrderStatus.Created,
        ticket: ticket
    });
    await order.save();

    // Publish an event saying that an order was created
    await new OrderCreatedPublisher(natsWrapper.client).publish({
        id: order.id,
        expiresAt: order.expiresAt.toISOString(),
        status: order.status,
        userId: order.userId,
        version: order.version,
        ticket:{
            id: ticket.id,
            price: ticket.price
        }
    });
    
    res.status(201).send(order);
});

export { router as newOrderRouter };