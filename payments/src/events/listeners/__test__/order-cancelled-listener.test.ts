import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledEvent, OrderCreatedEvent, OrderStatus, TicketCreatedEvent } from "@aktickets027/common";
import mongoose from "mongoose";
import { Message } from 'node-nats-streaming'
import { Order } from '../../../models/order';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
    // Create the order so we can cancel it
    const order = Order.build({
        id: (new mongoose.Types.ObjectId()).toHexString(),
        price: 20,
        status: OrderStatus.Created,
        userId: 'fakeuserid',
        version: 0
    });
    await order.save();

    // create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client);

    // Create a fake data event
    const data: OrderCancelledEvent['data'] = {
        version: 1,
        id: order.id,
        ticket:{
            id: 'faketicketid'
        }
    };

    // Create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg };
};

it('updates the status of the order', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // Write assertions to make sure a order was cancelled.
    const updatedOrder = await Order.findById(data.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // Write assertions to make sure ack function is called.
    expect(msg.ack).toBeCalledTimes(1);
});