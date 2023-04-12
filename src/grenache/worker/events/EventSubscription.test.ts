import { WorkerImplementation } from "../WorkerImplementation";
import { Worker } from "../Worker";
import {SubscribeToBlocktankEvent} from './EventDecorator'


class ServerImplementation extends WorkerImplementation {
}

class ListenerImplementation extends WorkerImplementation {
    @SubscribeToBlocktankEvent('worker:server', 'invoicePaid')
    async invoicePaidEvent(param: string) {
        console.log('invoicePaid', param)
        return true
      }
}


jest.setTimeout(60*1000)


describe('EventSubscription', () => {
    test('EventDecorator registered internally', async () => {
        const implementation = new ListenerImplementation()
        const worker = new Worker(implementation);
        jest.spyOn(implementation.subscriptions, 'initializeSubscriptions').mockImplementation(async () => {});
        try {
            await worker.start()
            expect(implementation.subscriptions.subscriptions.length).toEqual(1)
            const listener = implementation.subscriptions.subscriptions[0]
            expect(listener.eventName).toEqual('invoicePaid')
            expect(listener.workerName).toEqual('worker:server')
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
            expect(worker.gClient.call).toHaveBeenLastCalledWith('worker:server', '_subscribeToEvents', [worker.config.name, ['invoicePaid']])
        } finally {
            await worker.stop()
        }
    });

    test('Event notification', async () => {
        const serverImplementation = new ServerImplementation()
        const server = new Worker(serverImplementation, {
            name: 'worker:server',
            callbackSupport: true // Spies dont like argument length check. So we need to disable it.
        });

        const listenerImplementation = new ListenerImplementation()
        const listener = new Worker(listenerImplementation, {
            callbackSupport: true // Spies dont like argument length check. So we need to disable it.
        });
        try {
            jest.spyOn(serverImplementation, '_subscribeToEvents')
            await server.start();
            await listener.start()
            expect(serverImplementation._subscribeToEvents).toHaveBeenCalled()

            // jest.spyOn(listenerImplementation, 'invoicePaid');
            // await serverImplementation._emitEvent('invoicePaid', ['test'])
            // expect(listenerImplementation.invoicePaid).toHaveBeenCalled()
        } finally {
            await server.stop()
            await listener.stop()
        }
    });


});


