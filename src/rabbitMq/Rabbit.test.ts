import { sleep } from '../utils';
import * as amp from 'amqplib'
import RabbitPublisher from './RabbitPublisher'
import RabbitConsumer from './RabbitConsumer'



jest.setTimeout(60 * 1000)

// RabbitMq must be running on localhost:5672
describe('RabbitEvents', () => {
    /**
     * Test is very comprehensive, I know. TBD: Split into multiple tests.
     */
    test('publish, consume, throw error, backoff 100ms, retry', async () => {
        const connection = await amp.connect('amqp://localhost:5672')
        const publisher = new RabbitPublisher('worker:ln-worker', { connection })
        const consumer = new RabbitConsumer(`worker:bti-worker${Math.ceil(Math.random()*10000)}`, { 
            connection, 
            deleteInactiveQueueMs: 1*1000 // Cleans up queue after 1 second of inactivity. Increase to debug.
        })
        try {
            await publisher.init()
            await consumer.init()

            const pauseBetweenTasks = 100
            const waitOnSuccess = new Promise<boolean>(async (resolve, reject) => {
                let i = 0
                const retryCount = 5
                const timeoutId = setTimeout(() => { // Register timeout after 10 seconds so the test doesn't hang forever
                    return reject("Timeout waiting on success")
                }, 10*1000)
                const start = new Date()
                await consumer.onMessage('worker:ln-worker', 'ln.invoicePaid', (msg) => {
                    expect(i).toEqual(msg.attempt)
                    i++;
                    if (i < retryCount) {
                        throw new Error('retry')
                    }
                    const durationMs = new Date().getTime() - start.getTime()
                    expect(durationMs).toBeGreaterThan((retryCount-1)*pauseBetweenTasks)
                    expect(i).toEqual(retryCount)
                    clearTimeout(timeoutId) // Clear up timeout
                    resolve(true)
                }, {
                    backoffFunction: _ => {
                        return pauseBetweenTasks
                    }
                })
                await publisher.publish('ln.invoicePaid', JSON.stringify({ paid: true, id: 123456 }))
            })
            await waitOnSuccess
        } finally {
            await publisher.stop()
            await consumer.stop()
            await connection.close()
        }
    });

    xtest('2 consumers, different event types', async () => {
        const connection = await amp.connect('amqp://localhost:5672')
        const publisher = new RabbitPublisher('worker:ln-worker', { connection })
        const consumer1 = new RabbitConsumer('worker:bti-worker', { connection, deleteInactiveQueueMs: 60*1000 })
        const consumer2 = new RabbitConsumer('worker:bti-worker', { connection, deleteInactiveQueueMs: 60*1000 })
        try {
            await publisher.init()
            await consumer1.init()
            await consumer2.init()


            const waitOnResolveMessage = new Promise<any>(async (resolve, reject) => {
                const processed = new Set<string>()
                let i = 0;
                await consumer1.onMessage('worker:ln-worker', 'ln.invoicePaid', (msg) => {
                    console.log('consumer1 invoicePaid', msg.content)
                    processed.add(msg.content)
                })
                await consumer2.onMessage('worker:ln-worker', 'ln.invoicePaid', (msg) => {
                    console.log('consumer2 invoicePaid', msg.content)
                    processed.add(msg.content)
                })
                await consumer1.onMessage('worker:ln-worker', 'ln.invoiceCreated', (msg) => {
                    console.log('consumer1 invoiceCreated', msg.content)
                    processed.add(msg.content)
                })
                await consumer2.onMessage('worker:ln-worker', 'ln.invoiceCreated', (msg) => {
                    console.log('consumer2 invoiceCreated', msg.content)
                    processed.add(msg.content)
                })
                for (let i = 0; i< 500; i++) {
                    await publisher.publish('ln.invoicePaid', JSON.stringify({ paid: true, id: i, type: 'invoicePaid' }))
                    await publisher.publish('ln.invoiceCreated', JSON.stringify({ paid: true, id: i, type: 'invoiceCreated' }))
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

