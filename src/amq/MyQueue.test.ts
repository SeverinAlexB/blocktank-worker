import { sleep } from '../utils';
import * as amp from 'amqplib'
import RabbitPublisher from './RabbitPublisher'
import RabbitConsumer from './RabbitConsumer'



jest.setTimeout(60 * 1000)


describe('RabbitMqQueue', () => {

    test('test consume', async () => {
        const connection = await amp.connect('amqp://localhost:5672')
        const publisher = new RabbitPublisher('ln-worker', { connection })
        const consumer = new RabbitConsumer('bti-worker', 'ln-worker', { connection })
        try {
            await publisher.init()
            await consumer.init()

            await consumer.onMessage('ln.invoicePaid', async (msg) => {
                console.log(new Date(), 'onMessage', msg.content)
                // throw new Error('test')
            })
            await sleep(100*10)
            publisher.publish('ln.invoicePaid', 'test message' + (Math.random()*10000).toString())
            console.log('published')
            await sleep(1000*10)
        } finally {
            await publisher.stop()
            await consumer.stop()
            await connection.close()
        }
    });
});

