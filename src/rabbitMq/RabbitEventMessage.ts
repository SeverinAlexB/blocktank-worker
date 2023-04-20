export default class RabbitEventMessage {
    public attempt: number = 0;
    
    constructor(public sourceWorker: string, public eventName: string, public content: string) {}

    toJson(): string {
        return JSON.stringify({
            sourceWorker: this.sourceWorker,
            eventName: this.eventName,
            attempt: this.attempt,
            content: this.content
        })
    }

    get routingKey(): string {
        return `${this.sourceWorker}.${this.eventName}`
    }

    static fromJson(json: string): RabbitEventMessage {
        const obj = JSON.parse(json)
        const msg = new RabbitEventMessage(obj.sourceWorker, obj.eventName, obj.content)
        msg.attempt = obj.attempt
        return msg
    }
}