import { WorkerImplementation } from "../WorkerImplementation";
import { Worker } from "../Worker";
import {SubscribeToBlocktankEvent} from './ListenerDecorator'
import { WorkerNameType } from "../../WorkerNameType";

// Making the server name more generic so the DHT doesnt clash with old test names.
const serverWorkerName: WorkerNameType = `worker:server${Math.random().toString(36).substring(7)}` 

class ServerImplementation extends WorkerImplementation {}

class ListenerImplementation extends WorkerImplementation {
    @SubscribeToBlocktankEvent(serverWorkerName, 'invoicePaid')
    async invoicePaidEvent(param: string) {
        console.log('invoicePaid', param)
        return true
      }
}


jest.setTimeout(60*1000)


describe('EventManger', () => {
    test('EventDecorator registered internally', async () => {
        const implementation = new ListenerImplementation()
        const worker = new Worker(implementation);
        jest.spyOn(worker.events, 'initializeListeners').mockImplementation(async () => {});
        try {
            await worker.start()
            expect(worker.events.listeners.length).toEqual(1)
            const listener = worker.events.listeners[0]
            expect(listener.eventName).toEqual('invoicePaid')
            expect(listener.workerName).toEqual(serverWorkerName)
            expect(listener.propertyKey).toEqual('invoicePaidEvent')
        } finally {
            await worker.stop()
        }
    });

    test('Register the calls externally', async () => {
        const implementation = new ListenerImplementation()
        const worker = new Worker(implementation);
        jest.spyOn(worker.gClient, 'call').mockImplementation(async (_) => true);
        try {
            await worker.start()
            expect(worker.gClient.call).toHaveBeenCalled()
            expect(worker.gClient.call).toHaveBeenLastCalledWith(serverWorkerName, '__subscribeToEvents', [worker.config.name, ['invoicePaid']])
        } finally {
            await worker.stop()
        }
    });

    test('Register listener on server', async () => {
        const implementation = new ServerImplementation()
        const worker = new Worker(implementation);
        jest.spyOn(worker.gClient, 'call').mockImplementation(async (_) => true);
        try {
            await worker.start()
            const response = await worker.callMethod({
                method: '__subscribeToEvents',
                args: ['worker:client', ['invoicePaid']]
            })
            expect(response).toEqual(true)
            expect(worker.events.emitters.length).toEqual(1)
            const listener = worker.events.emitters[0]
            expect(listener.workerName).toEqual('worker:client')
            expect(listener.events[0]).toEqual('invoicePaid')
        } finally {
            await worker.stop()
        }
    });

    test('Server<>Client event interaction', async () => {
        const serverImplementation = new ServerImplementation()
        const server = new Worker(serverImplementation, {
            name: serverWorkerName
        });

        const listenerImplementation = new ListenerImplementation()
        const client = new Worker(listenerImplementation, {
            callbackSupport: true
        });
        jest.spyOn(listenerImplementation, 'invoicePaidEvent')
        try {
            await server.start();
            await client.start()

            expect(server.events.emitters.length).toEqual(1)

            await server.events.emitEvent('invoicePaid', ['test'])
            expect(listenerImplementation.invoicePaidEvent).toHaveBeenCalled()
        } finally {
            await server.stop()
            await client.stop()
        }
    });


});

