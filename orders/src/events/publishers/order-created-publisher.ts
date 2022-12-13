import { OrderCreatedEvent, Publisher, Subjects } from "@aktickets027/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent>{
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
}