import * as amp from 'amqplib'
import { RabbitConnectionOptions, defaultRabbitConnectionOptions } from './RabbitConnectionOptions'
import RabbitEventMessage from './RabbitEventMessage'
import { WorkerNameType } from '../grenache/WorkerNameType'

/**
 * A RabbitMQ publisher that publishes events to an exchange called `blocktank.{myWorkerName}.events.`
 * The exchange, once created is permanent and will not be deleted. In a production environment, you might want to clean up old exchanges.
 */
export default class RabbitPublisher {
    public connection: amp.Connection
    public channel: amp.Channel
    public options: RabbitConnectionOptions
    constructor(public myWorkerName: WorkerNameType, options: Partial<RabbitConnectionOptions> = {}) {
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

    /**
     * Stops RabbitMq connection.
     * @param cleanupRabbitMq Cleans up all objects on RabbitMQ. Used for testing.
     */
    async stop(cleanupRabbitMq = false) {
        if (cleanupRabbitMq) {
            await this.channel.deleteExchange(this.exchangeName)
        }

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
    async publish(eventName: string, data: any) {
        const event = new RabbitEventMessage(this.myWorkerName, eventName, data)
        const keepSending = this.channel.publish(this.exchangeName, event.routingKey, Buffer.from(event.toJson()))
        if (!keepSending) {
            console.warn('wait on drain event')
            await new Promise(resolve => this.channel.once('drain', resolve)) // Wait until the buffer is empty
            console.log('drained!')
        }
    }
}

