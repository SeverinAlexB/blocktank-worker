import { WorkerNameType } from "../../WorkerNameType";
import { Worker } from "../Worker";
import { BlocktankEventEmitter } from "./Emitter";
import { BlocktankEventListener } from "./Listener";
import { DecoratedListenerKey } from "./ListenerDecorator";


export class EventManager {
    public worker: Worker
    public emitters: BlocktankEventEmitter[] = [] // We emit these events
    public listeners: BlocktankEventListener[] = [] // We listen to these events


    public init(worker: Worker) {
        this.worker = worker
        this._extractDecoratoredListeners()
    }

    private _extractDecoratoredListeners() {
        const prototype = Object.getPrototypeOf(this.worker.implementation)
        this.listeners = prototype[DecoratedListenerKey] || []
    }

    public registerEmitter(workerName: WorkerNameType, names: string[]) {
        const sub = new BlocktankEventEmitter(workerName, names)
        this.emitters.push(sub)
        return true
    }

    /**
     * Emits an event to all registered emitters.
     * @param eventName 
     * @param args 
     */
    async emitEvent(eventName: string, args: any[]) {
        const targetEmitters = this.emitters.filter(sub => sub.events.includes(eventName))

        for (const emitter of targetEmitters) {
            await emitter.call(this.worker.gClient, eventName, args, this.worker.config.name)
        }
    }

    /**
     * Processes an incoming event.
     * @param workerName 
     * @param eventName 
     * @param args 
     * @returns 
     */
    async processEvent(workerName: WorkerNameType, eventName: string, args: any[]) {
        const targetSubscriptions = this.listeners.filter(sub => sub.eventName === eventName && sub.workerName === workerName)

        if (targetSubscriptions.length === 0) {
            console.error('Received event that we did not subscribed to', workerName, eventName, args)
            return
        }

        for (const sub of targetSubscriptions) {
            return await sub.call(this.worker.implementation, args)
        }
    }

    /**
     * Takes the registered Listeners and notifies the workers that we want to listen to their events.
     */
    public async initializeListeners() {
        const workerListeners = new Map<string, BlocktankEventListener[]>()
        for (const listener of this.listeners) {
            if (!workerListeners.has(listener.workerName)) {
                workerListeners.set(listener.workerName, [])
            }
            workerListeners.get(listener.workerName).push(listener)
        }

        for (const listeners of workerListeners.values()) {
            const eventNames = listeners.map(listener => listener.eventName)
            await this.worker.gClient.call(listeners[0].workerName, '__subscribeToEvents', [this.worker.config.name, eventNames])
        }
    }
}