import { RabbitConsumeOptions } from "../../../rabbitMq/RabbitConsumeOptions";
import RabbitEventMessage from "../../../rabbitMq/RabbitEventMessage";
import { WorkerNameType } from "../../WorkerNameType";
import { WorkerImplementation } from "../WorkerImplementation";

/**
 * Connects a registered event with the method that is being called in case this event is received.
 */
export class BlocktankEventListener {
    workerName: WorkerNameType;
    eventName: string;
    propertyKey: string; // methodName of the local function
    options: RabbitConsumeOptions
    
    async call(implementation: WorkerImplementation, event: RabbitEventMessage) {
        const func = (implementation as any)[this.propertyKey]        
        return await func.bind(implementation)(event)
    }
}