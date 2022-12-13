import { Listener, OrderCancelledEvent, Subjects } from "@aktickets027/common";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";
import { queueGroupName } from "./queue-group-name";

export class OrderCancelledListener extends Listener<OrderCancelledEvent>{
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
    queueGroupName: string = queueGroupName;
    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        // Find the ticket to cancel
        const ticket = await Ticket.findById(data.ticket.id);

        // If no ticket throw error
        if (!ticket) {
            throw new Error('Ticket not found.');
        }

        // Mark the ticket as being cancelled by clearing its orderId property
        ticket.set({ orderId: undefined });

        // Save the ticket
        await ticket.save();

        // Publish the ticket updated event so that the versions are all incremented in all listening services
        await new TicketUpdatedPublisher(this.client).publish({
            id: ticket.id,
            price: ticket.price,
            title: ticket.title,
            userId: ticket.userId,
            version: ticket.version,
            orderId: ticket.orderId
        });

        // Ack the message
        msg.ack();
    }

}