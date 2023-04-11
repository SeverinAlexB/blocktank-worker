import { WorkerNameType } from "../../WorkerNameType";
import { GrenacheClient } from "../../client/Client";
import { EventSubscription } from "./EventSubscription";

export class SubscriptionManager {
    public subscriptions: Map<string, EventSubscription> = new Map()
    constructor(public client: GrenacheClient) {}

    public addSubscription(workerName: WorkerNameType, names: string[]) {
        const sub = new EventSubscription(workerName, names)
        this.subscriptions.set(workerName, sub)
    }

    async call(eventName: string, args: any[]) {
        const targetSubscriptions = Array.from(this.subscriptions.values()).filter(sub => sub.events.includes(eventName))

        for (const sub of targetSubscriptions) {
            await sub.call(this.client, eventName, args)
        }
    }
}