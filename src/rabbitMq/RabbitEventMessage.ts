export default class RabbitEventMessage {
    /**
     * Number of delivery attempts. First message is always 0.
     */
    public attempt: number = 0;
    
    constructor(
        public sourceWorker: string, 
        public eventName: string, 
        public content: string
    ) {}

    /**
     * RabbitMQ internal routingkey
     */
    get routingKey(): string {
        return `${this.sourceWorker}.${this.eventName}`
    }

    toJson(): string {
        return JSON.stringify({
            sourceWorker: this.sourceWorker,
            eventName: this.eventName,
            attempt: this.attempt,
            content: this.content
        })
    }

    static fromJson(json: string): RabbitEventMessage {
        const obj = JSON.parse(json)
        const msg = new RabbitEventMessage(obj.sourceWorker, obj.eventName, obj.content)
        msg.attempt = obj.attempt
        return msg
    }
}