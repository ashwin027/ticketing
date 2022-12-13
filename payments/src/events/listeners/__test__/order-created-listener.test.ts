import { natsWrapper } from '../../../nats-wrapper';
import { OrderCreatedEvent, OrderStatus, TicketCreatedEvent } from "@aktickets027/common";
import mongoose from "mongoose";
import { Message } from 'node-nats-streaming'
import { OrderCreatedListener } from '../order-created-listener';
import { Order } from '../../../models/order';

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client);

    // Create a fake data event
    const data: OrderCreatedEvent['data'] = {
        version: 0,
        id: new mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        expiresAt: 'fakeexpiresat',
        userId: 'fakeuserid',
        ticket:{
            id: 'faketicketid',
            price: 20
        }
    };

    // Create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg };
};

it('replicates the order info', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // Write assertions to make sure a ticket was created.
    const order = await Order.findById(data.id);

    expect(order).toBeDefined();
    expect(order!.price).toEqual(data.ticket.price);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // Write assertions to make sure ack function is called.
    expect(msg.ack).toBeCalledTimes(1);
});