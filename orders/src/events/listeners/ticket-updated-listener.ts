import { Listener, Subjects, TicketCreatedEvent, TicketUpdatedEvent } from "@aktickets027/common";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent>{
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
    queueGroupName: string = queueGroupName;
    async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
        const { title, price, id, version } = data;

        // Find the ticket the user is trying to order in the database (should be one older version)
        const ticket = await Ticket.findByEvent({ id: id, version: version });

        if (!ticket) {
            throw new Error('Ticket not found.');
        }

        ticket.set({ title, price });
        await ticket.save();

        msg.ack();
    }

}