import { natsWrapper } from '../../../nats-wrapper';
import { OrderCreatedEvent, OrderStatus, TicketCreatedEvent } from "@aktickets027/common";
import mongoose from "mongoose";
import { Message } from 'node-nats-streaming'
import { Ticket } from "../../../models/ticket";
import { OrderCreatedListener } from "../order-created-listener";

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client);

    // Create and save a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 20,
        userId: new mongoose.Types.ObjectId().toHexString()
    });

    await ticket.save();

    // Create a fake data event
    const data: OrderCreatedEvent['data'] = {
        version: 0,
        id: new mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        userId: new mongoose.Types.ObjectId().toHexString(),
        expiresAt: 'teststamp',
        ticket: {
            id: ticket.id,
            price: ticket.price
        }
    };

    // Create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg, ticket };
};

it('finds and reserves the ticket', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // Write assertions to make sure a ticket was created.
    const ticket = await Ticket.findById(data.ticket.id);

    expect(ticket!.orderId).toBeDefined();
    expect(ticket!.orderId).toEqual(data.id);
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
    expect(data.id).toEqual(ticketUpdatedData.orderId);
});