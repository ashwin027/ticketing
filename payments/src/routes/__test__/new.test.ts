import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Payment } from '../../models/payment';
import { stripe } from '../../stripe';

jest.mock('../../stripe');

it('has a route handler listening to /api/tickets for post requests', async () => {
    const response = await request(app)
        .post('/api/payments')
        .send({});

    expect(response.status).not.toEqual(404);
});

it('returns a 404 when purchasing an order that does not exist', async () => {
    await request(app)
        .post('/api/payments')
        .set('Cookie', signin())
        .send({
            orderId: new mongoose.Types.ObjectId().toHexString(),
            token: "faketoken"
        }).expect(404);
});

it('returns a 401 when purchasing an order that does not belong to the user', async () => {
    const order = Order.build({
        id: (new mongoose.Types.ObjectId()).toHexString(),
        price: 20,
        status: OrderStatus.Created,
        userId: 'fakeuserid',
        version: 0
    });
    await order.save();

    await request(app)
        .post('/api/payments')
        .set('Cookie', signin())
        .send({
            orderId: order.id,
            token: "faketoken"
        }).expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
    const userId = (new mongoose.Types.ObjectId()).toHexString();
    const order = Order.build({
        id: (new mongoose.Types.ObjectId()).toHexString(),
        price: 20,
        status: OrderStatus.Cancelled,
        userId: userId,
        version: 0
    });
    await order.save();

    await request(app)
        .post('/api/payments')
        .set('Cookie', signin(userId))
        .send({
            orderId: order.id,
            token: "faketoken"
        }).expect(400);
});

it('returns a 201 with valid inputs', async () =>{
    const userId = (new mongoose.Types.ObjectId()).toHexString();
    const order = Order.build({
        id: (new mongoose.Types.ObjectId()).toHexString(),
        price: 20,
        status: OrderStatus.Created,
        userId: userId,
        version: 0
    });
    await order.save();

    await request(app)
        .post('/api/payments')
        .set('Cookie', signin(userId))
        .send({
            orderId: order.id,
            token: "tok_visa"
        }).expect(201);

    const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
    expect(chargeOptions.source).toEqual('tok_visa');
    expect(chargeOptions.amount).toEqual(2000);
    expect(chargeOptions.currency).toEqual('cad');
    
    const payment = await Payment.findOne({
        orderId: order.id
    });

    expect(payment).not.toBeNull();
    expect(payment!.orderId).toEqual(order.id);
    expect(payment!.stripeId).toEqual('fakestripeid');
});

