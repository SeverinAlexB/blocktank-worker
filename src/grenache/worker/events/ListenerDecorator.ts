import { WorkerNameType } from "../../WorkerNameType";
import { BlocktankEventListener } from "./Listener";


export const DecoratedListenerKey = 'registeredDecoratedListeners'

/**
 * Decorator used to register a method as a listener for a specific event.
 * @param workerName Worker that emits the event.
 * @param eventName Name of the event.
 * @returns 
 */
export function SubscribeToBlocktankEvent(workerName: WorkerNameType, eventName: string): any {
    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
        target[DecoratedListenerKey] = target[DecoratedListenerKey] || []
        const event: BlocktankEventListener = new BlocktankEventListener()
        event.workerName = workerName
        event.eventName = eventName
        event.propertyKey = propertyKey
        target[DecoratedListenerKey].push(event)
        return descriptor
    };

}