import { ExpirationCompleteEvent, Publisher, Subjects } from "@aktickets027/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent>{
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}