import { WorkerNameType } from "../../WorkerNameType";

export function SubscribeToBlocktankEvent(workerName: WorkerNameType, eventName: string): any {
    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {

        target['registeredEvents'] = target['registeredEvents'] || []
        target['registeredEvents'].push({workerName, eventName, propertyKey})
        console.log('decorator', target['registeredEvents'])
        return descriptor.value = function(...args: any[]) {
            this._subscribeToEvents(workerName, [eventName])
            return descriptor.value.apply(this, args)
        }
    };

}