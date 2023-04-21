
const WorkerImplementation = require("../src/grenache/worker/WorkerImplementation").WorkerImplementation;
const Worker = require("../src/grenache/worker/Worker").Worker;
const registerBlocktankEvent = require('../src/grenache/worker/events/ListenerDecorator').registerBlocktankEvent;
const sleep = require('../src/utils/sleep').sleep;

// Making the server name more generic so the DHT doesnt clash with old test names.
const serverWorkerName = `worker:server-${Math.random().toString(36).substring(7)}` 

class ListenerImplementation extends WorkerImplementation {
    async invoicePaidEvent(data) {
        // console.log('invoicePaid', data)
        return true
    }

    async helloWorld(name){
        return `Hello ${name}`
    }
}

// JS way to subscribe to events.
registerBlocktankEvent(serverWorkerName, 'invoicePaid', ListenerImplementation, 'invoicePaidEvent')


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
            const callData = implementation.invoicePaidEvent.mock.calls[0][0]
            expect(callData.attempt).toEqual(0)
            expect(callData.eventName).toEqual('invoicePaid')
            expect(callData.sourceWorker).toEqual(serverWorkerName)
            expect(callData.content).toEqual(['test'])
        } finally {
            await worker.stop({cleanupRabbitMq: true})
        }
    });


});


