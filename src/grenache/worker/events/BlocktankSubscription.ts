import { WorkerNameType } from "../../WorkerNameType";
import { WorkerImplementation } from "../WorkerImplementation";

export class BlocktankSubscription {
    workerName: WorkerNameType;
    eventName: string;
    propertyKey: string;

    isRegistered: boolean = false;

    async call(implementation: WorkerImplementation, args: any[]) {
        const func = (implementation as any)[this.propertyKey]
        if (!func) {
            throw new Error(`Worker event ${this.eventName} not found.`);
        }
        
        return await func(...args)
    }
}