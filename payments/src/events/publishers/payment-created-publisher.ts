import { PaymentCreatedEvent, Publisher, Subjects } from "@aktickets027/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent>{
    subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}