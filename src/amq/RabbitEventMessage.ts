export default class RabbitEventMessage {
    public attempt: number = 0;
    
    constructor(public eventName: string, public content: string) {}

    toJson(): string {
        return JSON.stringify({
            attempt: this.attempt,
            content: this.content
        })
    }

    static fromJson(json: string, eventName: string): RabbitEventMessage {
        const obj = JSON.parse(json)
        const msg = new RabbitEventMessage(eventName, obj.content)
        msg.attempt = obj.attempt
        return msg
    }
}