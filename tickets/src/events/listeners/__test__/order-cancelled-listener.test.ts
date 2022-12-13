import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledEvent, OrderCreatedEvent, OrderStatus, TicketCreatedEvent } from "@aktickets027/common";
import mongoose from "mongoose";
import { Message } from 'node-nats-streaming'
import { Ticket } from "../../../models/ticket";
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCancelledListener(natsWrapper.client);
    const orderId = new mongoose.Types.ObjectId().toHexString();

    // Create and save a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20,
        userId: new mongoose.Types.ObjectId().toHexString()
    });
    ticket.orderId = orderId;
    await ticket.save();

    // Create a fake data event
    const data: OrderCancelledEvent['data'] = {
        version: 0,
        id: orderId,
        ticket: {
            id: ticket.id
        }
    };

    // Create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg, ticket };
};

it('finds and cancels the ticket', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // Write assertions to make sure a ticket was created.
    const ticket = await Ticket.findById(data.ticket.id);

    expect(ticket!.orderId).not.toBeDefined();
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // Write assertions to make sure ack function is called.
    expect(msg.ack).toBeCalledTimes(1);
});

it('publishes a ticket updated event', async () => {
    const { listener, data, msg, ticket } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
    expect(ticketUpdatedData.orderId).not.toBeDefined();
});