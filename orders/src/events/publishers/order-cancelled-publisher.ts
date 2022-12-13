import { OrderCancelledEvent, Publisher, Subjects } from "@aktickets027/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent>{
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}