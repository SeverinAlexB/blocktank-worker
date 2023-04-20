import RabbitConsumer from "../../../rabbitMq/RabbitConsumer";
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
        this._extractDecoratoredListeners()
        await this.subscribeToEvents()
    }

    private async getRabbitMqConnectionLazy(): Promise<amp.Connection> {
        if (!this._rabbitMqConncetion) {
            if (this.worker.config.rabbitMq.connection) {
                this._rabbitMqConncetion = this.worker.config.rabbitMq.connection
            } else {
                this._rabbitMqConncetion = await amp.connect(this.worker.config.rabbitMq.amqpUrl)
            }
        }
        return this._rabbitMqConncetion
    }

    private async getRabbitPublisherLazy(): Promise<RabbitPublisher> {
        if (!this._publisher) {
            this._publisher = new RabbitPublisher(this.worker.config.name, {
                ...this.worker.config.rabbitMq,
                connection: await this.getRabbitMqConnectionLazy()
            })
            await this._publisher.init()
        }
        return this._publisher
    }

    private async getRabbitConsumerLazy(): Promise<RabbitConsumer> {
        if (!this._consumer) {
            this._consumer = new RabbitConsumer(this.worker.config.name , {
                ...this.worker.config.rabbitMq,
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
                await this.processEvent(listener.workerName, listener.eventName, msg)
            })
        }
    }

    /**
     * Emits an event to RabbitMq
     * @param eventName 
     * @param data 
     */
    async emitEvent(eventName: string, data: any) {
        const publisher = await this.getRabbitPublisherLazy()
        await publisher.publish(eventName, JSON.stringify(data))
    }

    /**
     * Processes an incoming event.
     * @param workerName 
     * @param eventName 
     * @param args 
     * @returns 
     */
    async processEvent(workerName: WorkerNameType, eventName: string, args: any[]) {
        const targetSubscriptions = this.listeners.filter(sub => sub.eventName === eventName && sub.workerName === workerName)

        if (targetSubscriptions.length === 0) {
            console.error('Received event that we did not subscribed to', workerName, eventName, args)
            return
        }

        for (const sub of targetSubscriptions) {
            return await sub.call(this.worker.implementation, args)
        }
    }

    /**
     * Takes the registered Listeners and notifies the workers that we want to listen to their events.
     */
    public async initializeListeners() {
        const workerListeners = new Map<string, BlocktankEventListener[]>()
        for (const listener of this.listeners) {
            if (!workerListeners.has(listener.workerName)) {
                workerListeners.set(listener.workerName, [])
            }
            workerListeners.get(listener.workerName).push(listener)
        }

        for (const listeners of workerListeners.values()) {
            const eventNames = listeners.map(listener => listener.eventName)
            await this.worker.gClient.call(listeners[0].workerName, '__subscribeToEvents', [this.worker.config.name, eventNames])
        }
    }

    /**
     * Shutdown any consumer or publishers.
     */
    public async stop() {
        if (this._publisher) {
            await this._publisher.stop()
        }
        if (this._consumer) {
            await this._consumer.stop()
        }
        if (this._rabbitMqConncetion) {
            await this._rabbitMqConncetion.close()
        }
    }
}