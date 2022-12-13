import { Listener, OrderStatus, PaymentCreatedEvent, Subjects, TicketCreatedEvent } from "@aktickets027/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent>{
    subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
    queueGroupName: string = queueGroupName;
    async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
        const { orderId } = data;

        let order = await Order.findById(orderId);

        if (!order){
            throw new Error("Order not found.")
        }

        order.set({status: OrderStatus.Complete});
        order.save();

        msg.ack();
    }

}