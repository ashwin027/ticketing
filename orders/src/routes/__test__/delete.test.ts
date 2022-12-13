import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

it('cancel/delete the order', async () => {
    // Create a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });

    await ticket.save();

    const user = signin();

    // make a request to build an order with this ticket
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id })
        .expect(201);

    // make a request to cancel the order
    const { body: fetchedOrder } = await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Cookie', user)
        .send({ ticketId: ticket.id })
        .expect(204);

    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('returns an error when one user tries to cancel/delete another users order', async () => {
    // Create a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });

    await ticket.save();

    const user = signin();

    // make a request to build an order with this ticket
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id })
        .expect(201);

    // make a request to cancel the order
    const { body: fetchedOrder } = await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Cookie', signin())
        .send({ ticketId: ticket.id })
        .expect(401);
});

it('Emits an event that the order was cancelled', async () => {
    // Create a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });

    await ticket.save();

    const user = signin();

    // make a request to build an order with this ticket
    const { body: order } = await request(app)
        .post('/api/orders')
        .set('Cookie', user)
        .send({ ticketId: ticket.id })
        .expect(201);

    // make a request to cancel the order
    await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Cookie', user)
        .send({ ticketId: ticket.id })
        .expect(204);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});
