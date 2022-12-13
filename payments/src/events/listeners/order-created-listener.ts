import { Listener, OrderCreatedEvent, Subjects } from "@aktickets027/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { queueGroupName } from "./queue-group-name";

export class OrderCreatedListener extends Listener<OrderCreatedEvent>{
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
    queueGroupName: string = queueGroupName;
    async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
        // Create the order
        const order = Order.build({
            id: data.id,
            userId: data.userId,
            price: data.ticket.price,
            status: data.status,
            version: data.version
        });

        await order.save();

        // ack the message
        msg.ack();
    }

}