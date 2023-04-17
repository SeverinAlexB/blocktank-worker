import { sleep } from '../utils';
import * as amp from 'amqplib'
import RabbitPublisher from './RabbitPublisher'
import RabbitConsumer from './RabbitConsumer'



jest.setTimeout(60 * 1000)

// RabbitMq must be running on localhost:5672

describe('RabbitEvents', () => {

    test('test produce/consume', async () => {
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
                publisher.publish('ln.invoicePaid', JSON.stringify({ paid: true, id: 123456 }))
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
});

