import { Publisher, Subjects, TicketUpdatedEvent } from "@aktickets027/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent>{
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}