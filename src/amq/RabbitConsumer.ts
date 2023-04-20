import * as amp from 'amqplib'
import { RabbitConnectionOptions, defaultRabbitConnectionOptions } from './RabbitConnectionOptions'
import { RabbitConsumeOptions, defaultRabbitConsumeOptions } from './RabbitConsumeOptions'
import RabbitEventMessage from './RabbitEventMessage'
import { RabbitConsumerOptions, defaultRabbitConsumerOptions } from './RabbitCosumerOptions'

export default class RabbitConsumer {

    public connection: amp.Connection
    public channel: amp.Channel
    public options: RabbitConsumerOptions
    constructor(public myWorkerName: string, public sourceWorkerName: string, options: Partial<RabbitConsumerOptions> = {}) {
        this.options = Object.assign({}, defaultRabbitConsumerOptions, options)
     }

    get sourceExchangeName(): string {
        return `blocktank.${this.sourceWorkerName}.events`
    }

    get myExchangeName(): string {
        return `blocktank.${this.myWorkerName}.consumer`
    }

    get myQueueName(): string {
        return `blocktank.${this.myWorkerName}`
    }

    /**
     * Initialize connection. Creates exchange `blocktank.${this.myWorkerName}.consumers`: This exchange is used to delay messages if needed.
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

        await this.channel.assertExchange(this.sourceExchangeName, 'fanout') // Make sure the target exchange exists
        await this.channel.assertExchange(this.myExchangeName, 'x-delayed-message', { // Create a new exchange for this consumer that is able to delay messages
            arguments: {
                'x-delayed-type': 'topic'
            }
        })
        this.channel.bindExchange(this.myExchangeName, this.sourceExchangeName, '')
    }

    /**
     * Stops RabbitMq connection.
     */
    async stop() {
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
    async onMessage(eventName: string, callback: (msg: RabbitEventMessage) => any, options: Partial<RabbitConsumeOptions> = {}) {
        options = Object.assign({}, defaultRabbitConsumeOptions, options)

        const queueName = this.myQueueName + '.' + eventName
        await this.channel.assertQueue(queueName, { 
            durable: true, // Make queue persistent in case of a RabbitMq restart.
            expires: this.options.deleteInactiveQueueMs === -1? undefined: this.options.deleteInactiveQueueMs // Delete queue after x ms of inactivity (no active consumers). Cleans up dead queues.
        })
        await this.channel.bindQueue(queueName, this.myExchangeName, eventName)

        await this.channel.consume(queueName, async msg => {
            let event: RabbitEventMessage;
            try {
                event = RabbitEventMessage.fromJson(msg.content.toString(), eventName)
            } catch (e) {
                console.error(`Failed to parse event message. Ignore message: ${msg.content.toString()}.`, e)
                return
            }
            
            try {
                await callback(event)
                this.channel.ack(msg)
            } catch (e) {
                // console.error(`Failed to process message ${msg.content.toString()}. Reschedule with delay.`, e)
                const delayMs = options.backoffFunction(event.attempt)
                event.attempt++
                msg.content = Buffer.from(event.toJson())
                await this.requeueAfterError(msg, delayMs)
            }
        })
    }

    private async requeueAfterError(msg: amp.Message, delayMs: number=0) {
        const headers: any = {}
        if (delayMs > 0) {
            headers['x-delay'] = delayMs
        }
        const keepSending = this.channel.publish(this.myExchangeName, msg.fields.routingKey, msg.content, {
            headers: headers
        })
        if (!keepSending) {
            await new Promise(resolve => this.channel.once('drain', resolve)) // Wait until the buffer is empty
        }
        this.channel.nack(msg, false, false)
    }
}

