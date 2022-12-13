import { natsWrapper } from '../../../nats-wrapper';
import { ExpirationCompleteEvent, OrderStatus, TicketCreatedEvent } from "@aktickets027/common";
import mongoose from "mongoose";
import { Message } from 'node-nats-streaming'
import { Ticket } from "../../../models/ticket";
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { Order } from '../../../models/order';

const setup = async () => {
    // create an instance of the listener
    const listener = new ExpirationCompleteListener(natsWrapper.client);

    // Create and save a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        price: 20,
        title: 'concert'
    });

    await ticket.save();

    // Create and save the order
    const order = Order.build({
        userId: new mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        expiresAt: new Date(),
        ticket: ticket
    });

    await order.save();

    // Create a fake data event
    const data: ExpirationCompleteEvent['data'] = {
        orderId: order.id
    };

    // Create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, order, data, msg };
};

it('updates the order status to cancelled', async () =>{
    const { listener, data, msg, order } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emits an order cancelled event', async () =>{
    const { listener, data, order, msg } = await setup();

    await listener.onMessage(data, msg);

    const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
    expect(eventData.id).toEqual(order.id);
});

it('acks the message', async () =>{
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});