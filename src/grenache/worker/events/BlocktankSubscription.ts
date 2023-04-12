import { WorkerNameType } from "../../WorkerNameType";

export class BlocktankSubscription {
    workerName: WorkerNameType;
    eventName: string;
    propertyKey: string;

    isRegistered: boolean = false;
}