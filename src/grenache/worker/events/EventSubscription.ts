import { WorkerNameType } from "../../WorkerNameType";
import { GrenacheClient } from "../../client/Client";

export class BlocktankListener {
    public lastSuccessfulCall: Date = new Date() // Persist?
    constructor(public workerName: WorkerNameType, public events: string[]) {}

    async call(client: GrenacheClient, eventName: string, args: any[]) {
        try {            
            const response = await client.call(this.workerName, eventName, args, {
                timeoutMs: 5000
            })
            this.lastSuccessfulCall = new Date()
            console.log(`Event ${eventName} sent to ${this.workerName}. Response: ${response}`)
        } catch (e) {
            console.error(`Error sending event ${eventName} to ${this.workerName}: ${e}`)
        }
    }
}