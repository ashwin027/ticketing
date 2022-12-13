import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

it('has a route handler listening to /api/orders for post requests', async () => {
    const response = await request(app)
        .post('/api/orders')
        .send({});

    expect(response.status).not.toEqual(404);
});

it('can only be accesssed only if the user is signed in', async () => {
    await request(app)
        .post('/api/orders')
        .send({})
        .expect(401);
});

it('returns a status other than 401 if the user is signed in', async () => {
    const response = await request(app)
        .post('/api/orders')
        .set('Cookie', signin())
        .send({});

    expect(response.status).not.toEqual(401);
});


it('returns an error if an invalid ticket id is provided', async () => {
    await request(app)
        .post('/api/orders')
        .set('Cookie', signin())
        .send({})
        .expect(400);

    await request(app)
        .post('/api/orders')
        .set('Cookie', signin())
        .send({ ticketId: '' })
        .expect(400);
});

it('Returns an error if the ticket does not exist', async () => {
    const ticketId = new mongoose.Types.ObjectId();
    await request(app)
        .post('/api/orders')
        .set('Cookie', signin())
        .send({ ticketId })
        .expect(404);
});

it('Returns an error if the ticket is already reserved', async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    const order = Order.build({
        ticket: ticket,
        status: OrderStatus.Created,
        expiresAt: new Date(),
        userId: 'fakeuser'
    });

    await order.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', signin())
        .send({ ticketId: ticket.id })
        .expect(400);
});

it('Reserved a ticket', async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', signin())
        .send({ ticketId: ticket.id })
        .expect(201);
});

it('Emits an order created event', async () => {
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'concert',
        price: 20
    });
    await ticket.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', signin())
        .send({ ticketId: ticket.id })
        .expect(201);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});


