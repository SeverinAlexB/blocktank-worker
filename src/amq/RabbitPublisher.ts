import * as amp from 'amqplib'
import { RabbitConnectionOptions, defaultRabbitConnectionOptions } from './RabbitConnectionOptions'
import RabbitEventMessage from './RabbitEventMessage'

export default class RabbitPublisher {

    public connection: amp.Connection
    public channel: amp.Channel
    public options: RabbitConnectionOptions
    constructor(public myWorkerName: string, options: Partial<RabbitConnectionOptions> = {}) {
        this.options = Object.assign({}, defaultRabbitConnectionOptions, options)
     }

    get exchangeName(): string {
        return `blocktank.${this.myWorkerName}.events`
    }

    async init() {
        if (this.options.connection) {
            this.connection = this.options.connection
        } else {
            this.connection = await amp.connect(
                this.options.amqpUrl
            )
        }
        this.channel = await this.connection.createChannel()
        await this.channel.assertExchange(this.exchangeName, 'fanout')
    }

    async stop() {
        if (this.options.connection) {
            await this.channel.close()
        } else {
            await this.connection.close()
        }
    }

    publish(eventName: string, message: string) {
        const event = new RabbitEventMessage(eventName, message)
        return this.channel.publish(this.exchangeName, eventName, Buffer.from(event.toJson()))
    }
}

