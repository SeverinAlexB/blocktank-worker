import { WorkerImplementation } from "./WorkerImplementation";
import { Worker } from "./Worker";
import {SubscribeToBlocktankEvent} from './events/EventDecorator'


class ServerImplementation extends WorkerImplementation {
}

class ListenerImplementation extends WorkerImplementation {
    // static eventSubscriptions = [
    //     new EventSubscription('worker:server', ['invoicePaid'])
    // ]

    @SubscribeToBlocktankEvent('worker:server', 'invoicePaid')
    async invoicePaid(param: string) {
        console.log('invoicePaid', param)
        return true
      }
}


jest.setTimeout(60*1000)


describe('EventSubscription', () => {
    test('EventDecorator', async () => {
        const implementation = new ListenerImplementation()
        await implementation.invoicePaid('test')
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

            jest.spyOn(listenerImplementation, 'invoicePaid');
            await serverImplementation._emitEvent('invoicePaid', ['test'])
            expect(listenerImplementation.invoicePaid).toHaveBeenCalled()
        } finally {
            await server.stop()
            await listener.stop()
        }
    });


});


