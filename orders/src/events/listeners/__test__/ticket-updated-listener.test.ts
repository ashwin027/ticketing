import { natsWrapper } from '../../../nats-wrapper';
import { TicketUpdatedEvent } from "@aktickets027/common";
import mongoose from "mongoose";
import { Message } from 'node-nats-streaming'
import { Ticket } from "../../../models/ticket";
import { TicketUpdatedListener } from "../ticket-updated-listener";

const setup = async () => {
    // create an instance of the listener
    const listener = new TicketUpdatedListener(natsWrapper.client);

    // Create and save a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        price: 20,
        title: 'concert'
    });

    await ticket.save();

    // Create a fake data event
    const data: TicketUpdatedEvent['data'] = {
        version: ticket.version + 1,
        id: ticket.id,
        title: 'concert updated',
        price: 10,
        userId: new mongoose.Types.ObjectId().toHexString()
    };

    // Create a fake message object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg, ticket };
};

it('finds, updates and saves a ticket', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // // Write assertions to make sure a ticket was updated.
    const ticket = await Ticket.findById(data.id);

    expect(ticket!.title).toEqual(data.title);
    expect(ticket!.price).toEqual(data.price);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    // Call the onmessage fucntion with the data object + message object
    await listener.onMessage(data, msg);

    // Write assertions to make sure ack function is called.
    expect(msg.ack).toBeCalledTimes(1);
});

it('does not call ack if the event has a skipped version number', async () => {
    const { msg, data, listener, ticket } = await setup();

    data.version = 10;

    try {
        await listener.onMessage(data, msg);
    } catch (err) {}

    expect(msg.ack).not.toBeCalled();
});