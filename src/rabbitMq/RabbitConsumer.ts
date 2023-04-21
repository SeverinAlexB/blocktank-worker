import * as amp from 'amqplib'
import { RabbitConsumeOptions, defaultRabbitConsumeOptions } from './RabbitConsumeOptions'
import RabbitEventMessage from './RabbitEventMessage'
import { RabbitConsumerOptions, defaultRabbitConsumerOptions } from './RabbitCosumerOptions'
import { WorkerNameType } from '../grenache/WorkerNameType'


/**
 * A RabbitMQ consumer that consumes events from another worker.
 * It creates a new exchange `{namespace}.{myWorkerName}.consumers` for each worker + a queue `{namespace}.{myWorkerName}.{sourceWorkerName}.{eventName}` for each event.
 * The exchange + queue will clean up automatically in case the consumer is stopped.
 */
export default class RabbitConsumer {
    public connection: amp.Connection
    public channel: amp.Channel
    public options: RabbitConsumerOptions
    public queueNames: string[] = []
    constructor(public myWorkerName: WorkerNameType, options: Partial<RabbitConsumerOptions> = {}) {
        this.options = Object.assign({}, defaultRabbitConsumerOptions, options)
    }

    get sourceExchangeName(): string {
        return `${this.options.namespace}.events`
    }

    get myExchangeName(): string {
        return `${this.options.namespace}.${this.myWorkerName}.consumer`
    }

    get myQueueName(): string {
        return `${this.options.namespace}.${this.myWorkerName}`
    }

    /**
     * Initialize connection. Creates exchange `{namespace}.${this.myWorkerName}.consumers`: This exchange is used to delay messages if needed.
     */
    async init() {
        if (this.options.connection) {
            this.connection = this.options.connection
        } else {
            this.connection = await amp.connect(
                this.options.amqpUrl!
            )
        }
        this.channel = await this.connection.createChannel()
    }

    /**
     * Stops RabbitMq connection.
     * @param cleanupRabbitMq Cleans up all objects on RabbitMQ. Used for testing.
     */
    async stop(cleanupRabbitMq=false) {
        if (cleanupRabbitMq) {
            for (const queueName of this.queueNames) {
                await this.channel.deleteQueue(queueName)
            }
            await this.channel.deleteExchange(this.myExchangeName)
        }
        await this.channel.close()
        if (!this.options.connection) {
            await this.connection.close()
        }
    }

    /**
     * Subscribes to events.
     * @param eventName Name of the event.
     * @param callback Callback function that is called when an event is received.
     * @param options Define a backoff function in case of an error. Default: Exponential backoff.
     */
    async onMessage(sourceWorkerName: WorkerNameType, eventName: string, callback: (msg: RabbitEventMessage) => any, options: Partial<RabbitConsumeOptions> = {}) {
        const opts: RabbitConsumeOptions = Object.assign({}, defaultRabbitConsumeOptions, options)

        await this.channel.assertExchange(this.sourceExchangeName, 'fanout') // Make sure the source exchange exists
        await this.channel.assertExchange(this.myExchangeName, 'x-delayed-message', { // Create a new exchange for this consumer that is able to delay messages
            autoDelete: true, // Delete this exchange if no queue is present anymore.
            arguments: {
                'x-delayed-type': 'topic'
            }
        })
        this.channel.bindExchange(this.myExchangeName, this.sourceExchangeName, '')

        // Create queue that subscribes only to the events we ask for.
        const routingKey = `${sourceWorkerName}.${eventName}`
        const queueName = `${this.myQueueName}.${routingKey}`

        await this.channel.assertQueue(queueName, {
            durable: true, // Make queue persistent in case of a RabbitMq restart.
            expires: this.options.deleteInactiveQueueMs === -1 ? undefined : this.options.deleteInactiveQueueMs // Delete queue after x ms of inactivity (no active consumers). Cleans up dead queues.
        })
        this.queueNames.push(queueName)
        await this.channel.bindQueue(queueName, this.myExchangeName, routingKey)

        // Acutally consume messages
        await this.channel.consume(queueName, async msg => {
            if (!msg) {
                return
            }
            let event: RabbitEventMessage;
            try {
                event = RabbitEventMessage.fromJson(msg.content.toString())
            } catch (e) {
                console.error(`Failed to parse event message. Ignore message: ${msg.content.toString()}.`, e)
                return
            }

            try {
                await callback(event)
                this.channel.ack(msg)
            } catch (e) {
                // console.error(`Failed to process message ${msg.content.toString()}. Reschedule with delay.`, e)
                const delayMs = opts.backoffFunction(event.attempt)
                event.attempt++
                msg.content = Buffer.from(event.toJson())
                await this.requeueAfterError(msg, delayMs)
            }
        })
    }

    private async requeueAfterError(msg: amp.Message, delayMs: number = 0) {
        const headers: any = {}
        if (delayMs > 0) {
            headers['x-delay'] = delayMs
        }

        const keepSending = this.channel.publish(this.myExchangeName, msg.fields.routingKey, msg.content, {
            headers: headers
        })
        this.channel.nack(msg, false, false)
        if (!keepSending) {
            await new Promise(resolve => this.channel.once('drain', resolve)) // Wait until the buffer is empty
        }

    }
}

