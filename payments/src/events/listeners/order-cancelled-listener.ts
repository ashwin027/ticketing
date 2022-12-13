import { Listener, OrderCancelledEvent, OrderStatus, Subjects } from "@aktickets027/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { queueGroupName } from "./queue-group-name";

export class OrderCancelledListener extends Listener<OrderCancelledEvent>{
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
    queueGroupName: string = queueGroupName;
    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        // Find the order
        const order = await Order.findOne({
            id: data.id,
            version: data.version - 1
        });

        if (!order) {
            throw new Error("Order not found.");
        }

        // Update the order status
        order.set({ status: OrderStatus.Cancelled });
        await order.save();

        // Ack the message
        msg.ack();
    }

}