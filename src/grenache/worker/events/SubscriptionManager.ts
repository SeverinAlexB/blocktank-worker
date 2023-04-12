import { WorkerNameType } from "../../WorkerNameType";
import { Worker } from "../Worker";
import { BlocktankListener } from "./EventSubscription";
import { BlocktankSubscription } from "./BlocktankSubscription";
import { DecoratedListenerKey } from "./EventDecorator";


export class SubscriptionManager {
    public worker: Worker
    public listeners: BlocktankListener[] = [] // We emit these events
    public subscriptions: BlocktankSubscription[] = [] // We listen to these events


    public init(worker: Worker) {
        this.worker = worker
        this._extractDecoratoredListeners()
    }

    private _extractDecoratoredListeners() {
        const prototype = Object.getPrototypeOf(this.worker.implementation)
        this.subscriptions = prototype[DecoratedListenerKey] || []
    }

    public addSubscription(workerName: WorkerNameType, names: string[]) {
        const sub = new BlocktankListener(workerName, names)
        this.listeners.push(sub)
    }

    async call(eventName: string, args: any[]) {
        const targetSubscriptions = this.listeners.filter(sub => sub.events.includes(eventName))

        for (const sub of targetSubscriptions) {
            await sub.call(this.worker.gClient, eventName, args)
        }
    }

    public async initializeSubscriptions() {
        const workerSubs = new Map<string, BlocktankSubscription[]>()
        for (const sub of this.subscriptions) {
            if (!workerSubs.has(sub.workerName)) {
                workerSubs.set(sub.workerName, [])
            }
            workerSubs.get(sub.workerName).push(sub)
        }

        for (const subs of workerSubs.values()) {
            const eventNames = subs.map(listener => listener.eventName)
            await this.worker.gClient.call(subs[0].workerName, '_subscribeToEvents', [this.worker.config.name, eventNames])
        }
    }
}