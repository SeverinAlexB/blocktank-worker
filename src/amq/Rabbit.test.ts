import { sleep } from '../utils';
import * as amp from 'amqplib'
import RabbitPublisher from './RabbitPublisher'
import RabbitConsumer from './RabbitConsumer'



jest.setTimeout(60 * 1000)

// RabbitMq must be running on localhost:5672

describe('RabbitEvents', () => {

    test('produce/consume', async () => {
        const connection = await amp.connect('amqp://localhost:5672')
        const publisher = new RabbitPublisher('ln-worker', { connection })
        const consumer = new RabbitConsumer('bti-worker', 'ln-worker', { connection })
        try {
            await publisher.init()
            await consumer.init()

            const waitOnResolveMessage = new Promise<any>(async (resolve, reject) => {
                consumer.onMessage('ln.invoicePaid', (msg) => {
                    resolve({
                        timeout: false,
                        content: msg.content
                    })
                })
                await publisher.publish('ln.invoicePaid', JSON.stringify({ paid: true, id: 123456 }))
                await sleep(1000) // timeout
                resolve({
                        timeout: false,
                        content: undefined
                    })
            })
            const response = await waitOnResolveMessage
            expect(response.timeout).toBe(false)
            await sleep(1000*10)
        } finally {
            await publisher.stop()
            await consumer.stop()
            await connection.close()
        }
    });

    test('2 consumers', async () => {
        const connection = await amp.connect('amqp://localhost:5672')
        const publisher = new RabbitPublisher('ln-worker', { connection })
        const consumer1 = new RabbitConsumer('bti-worker', 'ln-worker', { connection, deleteInactiveQueueMs: 60*1000 })
        const consumer2 = new RabbitConsumer('bti-worker', 'ln-worker', { connection, deleteInactiveQueueMs: 60*1000 })
        try {
            await publisher.init()
            await consumer1.init()
            await consumer2.init()


            const waitOnResolveMessage = new Promise<any>(async (resolve, reject) => {
                const processed = new Set<string>()
                let i = 0;
                consumer1.onMessage('ln.invoicePaid', (msg) => {
                    console.log('consumer1', msg.content)
                    processed.add(msg.content)
                })
                consumer2.onMessage('ln.invoicePaid', (msg) => {
                    console.log('consumer2', msg.content)
                    processed.add(msg.content)
                }, {
                    backoffFunction: (attempt) => 0
                })
                for (let i = 0; i< 1000; i++) {
                    await publisher.publish('ln.invoicePaid', JSON.stringify({ paid: true, id: i }))
                }
                
                await sleep(10*1000) // timeout
                resolve({
                        timeout: false,
                        content: undefined
                    })
                    console.log('processed', processed.size, i)
            })
            const response = await waitOnResolveMessage
            expect(response.timeout).toBe(false)
            await sleep(1000*10)
        } finally {
            await publisher.stop()
            await consumer1.stop()
            await consumer2.stop()
            await connection.close()
        }
    });
});

