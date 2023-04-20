import * as amp from 'amqplib'
import { RabbitConnectionOptions, defaultRabbitConnectionOptions } from './RabbitConnectionOptions'
import RabbitEventMessage from './RabbitEventMessage'

/**
 * A RabbitMQ publisher that publishes events to an exchange called `blocktank.{myWorkerName}.events.`
 */
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

    /**
     * Setup connection and create exchange object `blocktank.${this.myWorkerName}.events` on RabbitMq.
     */
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

    /**
     * Publishes an event to RabbitMq
     * @param eventName Name of the event the consumer can subscribe to.
     * @param message 
     * @returns 
     */
    async publish(eventName: string, message: string) {
        const event = new RabbitEventMessage(eventName, message)
        const keepSending = this.channel.publish(this.exchangeName, eventName, Buffer.from(event.toJson()))
        if (!keepSending) {
            console.warn('wait on drain event')
            await new Promise(resolve => this.channel.once('drain', resolve)) // Wait until the buffer is empty
            console.log('drained!')
        }
    }
}

