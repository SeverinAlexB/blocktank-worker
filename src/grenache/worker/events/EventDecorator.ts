import { WorkerNameType } from "../../WorkerNameType";
import { BlocktankSubscription } from "./BlocktankSubscription";


export const DecoratedListenerKey = 'registeredDecoratedListeners'

export function SubscribeToBlocktankEvent(workerName: WorkerNameType, eventName: string): any {
    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
        target[DecoratedListenerKey] = target[DecoratedListenerKey] || []
        const event: BlocktankSubscription = new BlocktankSubscription()
        event.workerName = workerName
        event.eventName = eventName
        event.propertyKey = propertyKey
        target[DecoratedListenerKey].push(event)
        return descriptor
    };

}