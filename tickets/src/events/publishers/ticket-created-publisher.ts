import { Publisher, Subjects, TicketCreatedEvent } from "@aktickets027/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent>{
    subject: Subjects.TicketCreated = Subjects.TicketCreated;
}