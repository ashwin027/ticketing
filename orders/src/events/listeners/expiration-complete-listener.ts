

import { ExpirationCompleteEvent, Listener, OrderStatus, Subjects } from "@aktickets027/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { OrderCancelledPublisher } from "../publishers/order-cancelled-publisher";
import { queueGroupName } from "./queue-group-name";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent>{
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
    queueGroupName: string = queueGroupName;
    async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
        const { orderId } = data;

        const order = await Order.findById(orderId).populate('ticket');
        if (!order) {
            throw new Error("Order not found.");
        }

        if (order.status===OrderStatus.Complete){
            return msg.ack();
        }

        // Cancel the order
        order.set({
            status: OrderStatus.Cancelled
        });
        await order.save();

        // Publish the order cancelled event
        await new OrderCancelledPublisher(this.client).publish({
            id: order.id,
            version: order.version,
            ticket: {
                id: order.ticket.id
            }
        });

        // Ack the message
        msg.ack();
    }

}