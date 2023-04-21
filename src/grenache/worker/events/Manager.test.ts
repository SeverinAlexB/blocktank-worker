import { WorkerImplementation } from "../WorkerImplementation";
import { Worker } from "../Worker";
import {SubscribeToBlocktankEvent} from './ListenerDecorator'
import { WorkerNameType } from "../../WorkerNameType";
import { sleep } from "../../../utils";
import RabbitEventMessage from "../../../rabbitMq/RabbitEventMessage";

// Making the server name more generic so the DHT doesnt clash with old test names.
const serverWorkerName: WorkerNameType = `worker:server-${Math.random().toString(36).substring(7)}` 


class ListenerImplementation extends WorkerImplementation {
    @SubscribeToBlocktankEvent(serverWorkerName, 'invoicePaid')  // Subscribe to myself. This makes sure the source worker actually exists.
    async invoicePaidEvent(data: any) {
        // console.log('invoicePaid', data)
        return true
    }
}


jest.setTimeout(60*1000)


describe('EventManger', () => {
    test('EventDecorator registered internally', async () => {
        const implementation = new ListenerImplementation()
        const worker = new Worker(implementation, {
            name: serverWorkerName
        } );
        try {
            await worker.start()
            expect(worker.events.listeners.length).toEqual(1)
            const listener = worker.events.listeners[0]
            expect(listener.eventName).toEqual('invoicePaid')
            expect(listener.workerName).toEqual(serverWorkerName)
            expect(listener.propertyKey).toEqual('invoicePaidEvent')
        } finally {
            await worker.stop({cleanupRabbitMq: true})
        }
    });

    test('Server<>Client event interaction', async () => {
        const implementation = new ListenerImplementation()
        const worker = new Worker(implementation, {
            name: serverWorkerName
        });
        jest.spyOn(implementation, 'invoicePaidEvent')
        try {
            await worker.start();
            await worker.events.emitEvent('invoicePaid', ['test'])
            await sleep(500)
            expect(implementation.invoicePaidEvent).toHaveBeenCalled()
            const callData = (implementation.invoicePaidEvent as any).mock.calls[0][0] as RabbitEventMessage
            expect(callData.attempt).toEqual(0)
            expect(callData.eventName).toEqual('invoicePaid')
            expect(callData.sourceWorker).toEqual(serverWorkerName)
            expect(callData.content).toEqual(['test'])
        } finally {
            await worker.stop({cleanupRabbitMq: true})
        }
    });


});


