import { WorkerNameType } from "../../WorkerNameType";
import { WorkerImplementation } from "../WorkerImplementation";
import { BlocktankEventListener } from "./Listener";


export const DecoratedListenerKey = 'registeredDecoratedListeners'

function _registerBlocktankEvent(workerName: WorkerNameType, eventName: string, targetClass: any, methodName: string) {
    targetClass[DecoratedListenerKey] = targetClass[DecoratedListenerKey] || []
    const event: BlocktankEventListener = new BlocktankEventListener()
    event.workerName = workerName
    event.eventName = eventName
    event.propertyKey = methodName
    targetClass[DecoratedListenerKey].push(event)
}

/**
 * Decorator used to register a method as a listener for a specific event.
 * @param workerName Worker that emits the event.
 * @param eventName Name of the event.
 * @returns 
 */
export function SubscribeToBlocktankEvent(workerName: WorkerNameType, eventName: string): any {
    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
        _registerBlocktankEvent(workerName, eventName, target, propertyKey)
        return descriptor
    };

}

/**
 * Register a method as a listener for a specific event manually. Used for JS mostly.
 * @param workerName Worker that emits the event.
 * @param eventName Name of the event.
 * @param targetClass WorkerImplementation
 * @param methodName Name of the method of the WorkerImplementation that should be called in case of an event.
 */
export function registerBlocktankEvent(workerName: WorkerNameType, eventName: string, targetClass: WorkerImplementation, methodName: string) {
    _registerBlocktankEvent(workerName, eventName, (targetClass as any).prototype, methodName)
}