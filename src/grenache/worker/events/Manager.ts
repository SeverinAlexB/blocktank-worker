import RabbitConsumer from "../../../rabbitMq/RabbitConsumer";
import RabbitEventMessage from "../../../rabbitMq/RabbitEventMessage";
import RabbitPublisher from "../../../rabbitMq/RabbitPublisher";
import { WorkerNameType } from "../../WorkerNameType";
import { Worker } from "../Worker";
import { BlocktankEventListener } from "./Listener";
import { DecoratedListenerKey } from "./ListenerDecorator";
import * as amp from 'amqplib'


export class EventManager {
    public worker: Worker
    public listeners: BlocktankEventListener[] = [] // We listen to these events
    private _publisher: RabbitPublisher;
    private _consumer: RabbitConsumer;
    private _rabbitMqConncetion: amp.Connection;

    public async init(worker: Worker) {
        this.worker = worker
        await this.getRabbitPublisherLazy()
        this._extractDecoratoredListeners()
        await this.subscribeToEvents()
    }

    private async getRabbitMqConnectionLazy(): Promise<amp.Connection> {
        if (!this._rabbitMqConncetion) {
            if (this.worker.config.connection) {
                this._rabbitMqConncetion = this.worker.config.connection
            } else {
                this._rabbitMqConncetion = await amp.connect(this.worker.config.amqpUrl!)
            }
        }
        return this._rabbitMqConncetion
    }

    private async getRabbitPublisherLazy(): Promise<RabbitPublisher> {
        if (!this._publisher) {
            this._publisher = new RabbitPublisher(this.worker.config.name, {
                ...this.worker.config,
                connection: await this.getRabbitMqConnectionLazy()
            })
            await this._publisher.init()
        }
        return this._publisher
    }

    private async getRabbitConsumerLazy(): Promise<RabbitConsumer> {
        if (!this._consumer) {
            this._consumer = new RabbitConsumer(this.worker.config.name , {
                ...this.worker.config,
                connection: await this.getRabbitMqConnectionLazy(),
            })
            await this._consumer.init()
        }
        return this._consumer
    }

    private _extractDecoratoredListeners() {
        const prototype = Object.getPrototypeOf(this.worker.implementation)
        this.listeners = prototype[DecoratedListenerKey] || []
    }

    private async subscribeToEvents() {
        for (const listener of this.listeners) {
            const consumer = await this.getRabbitConsumerLazy()
            await consumer.onMessage(listener.workerName, listener.eventName, async (msg: any) => {
                await this.processEvent(msg)
            }, listener.options)
        }
    }

    /**
     * Emits an event to RabbitMq
     * @param eventName 
     * @param data 
     */
    async emitEvent(eventName: string, data: any) {
        const publisher = await this.getRabbitPublisherLazy()
        await publisher.publish(eventName, data)
    }

    /**
     * Processes an incoming event.
     * @param workerName 
     * @param eventName 
     * @param args 
     * @returns 
     */
    async processEvent(event: RabbitEventMessage) {
        const targetSubscriptions = this.listeners.filter(sub => sub.eventName === event.eventName && sub.workerName === event.sourceWorker)

        if (targetSubscriptions.length === 0) {
            console.error('Received event that we did not subscribed to', event)
            return
        }

        for (const sub of targetSubscriptions) {
            return await sub.call(this.worker.implementation, event)
        }
    }

    /**
     * Shutdown any consumer or publishers.
     * @param cleanupRabbitMq Cleans up all objects on RabbitMQ. Used for testing.
     */
    public async stop(cleanupRabbitMq: boolean = false) {
        if (this._publisher) {
            await this._publisher.stop(cleanupRabbitMq)
        }
        if (this._consumer) {
            await this._consumer.stop(cleanupRabbitMq)
        }
        if (this._rabbitMqConncetion) {
            await this._rabbitMqConncetion.close()
        }
    }
}