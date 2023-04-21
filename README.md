# Blocktank Worker 

This module is the base class that all microservice workers in Blocktank use. It is written in Typescript but can also be used with javascript.

## Usage

**Install package**
```bash
npm i git+https://github.com/SeverinAlexB/blocktank-worker.git#typescript
```

**Run DHT for worker discovery**
```bash
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002' &
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001' &  
```

**Run RabbitMQ for events**
```bash
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 heidiks/rabbitmq-delayed-message-exchange:3.10.2-management
```

Open the dashboard http://localhost:15672/ and login with guest/guest.

## Worker

A Worker consists of 
* a server that listens on method calls.
* a client that can call other servers.
* RabbitMQ publisher (fanout exchange).
* RabbitMQ consumer (topic exchange + a queue for each event type).


```typescript
import { Worker, WorkerImplementation, waitOnSigint, RabbitEventMessage } from 'blocktank-worker';


class MyFirstWorkerImplementation extends WorkerImplementation {
    /**
     * Every method defined in here can be called by other workers/clients.
     */
    async helloWorld(name1: string, name2: string) {
        return `Hello ${name1} and ${name2}`;
    }

    async callOtherWorkerUsdToBtc(usd: number) {
        const exchangeRate = this.runner.gClient.encapsulateWorker('exchange_rate') // Get exchangeRate worker
        const btcUsd = await exchangeRate.getRate("BTCUSD") // Call method on exchangeRate worker.
        console.log('Current BTCUSD price is', btcUsd) 
        // Current BTCUSD price is $30,000
        return usd/btcUsd
    }

    @SubscribeToBlocktankEvent('lightning', 'invoicePaid')
    async onLightningInvoicePaidEvent(event: RabbitEventMessage) {
        // This method is called when `lightning` emits a `invoicePaid` event.
        const eventData = event.content;
    }

    async emitMyOwnEvent() {
        await this.runner.events.emitEvent('myEventName', { myData: 'myValue' })
        // Decorator @SubscribeToBlocktankEvent('MyFirstWorker', 'myEventName') subscribes to this event.
    }
}

const runner = new Worker(new MyFirstWorkerImplementation(), {
    name: 'MyFirstWorker', // Name of the worker.
    emitsEvents: true // If true, this worker will create the nessecary RabbitMQ objects and is able to emit events. Default: false
})
try {
    await runner.start();
    await waitOnSigint() // Wait on Ctrl+C
} finally {
    await runner.stop()
}

```

### Class WorkerImplementation

* Supports, async and sync and callback functions.
    * If callback functions are used, initialize the Worker with `callbackSupport: true`.
* Automatically returns `Error`s.
* Able to emit and receive events.
    * Events are automatically retried on error in an exponential backoff manner.

**client** *GrenacheClient* to call other workers.


### Class Worker

**constructor(worker, config?)**

* `worker`: *WorkerImplementation*
* `config?` *GrenacheServerConfig*
    * `name?` *string* Name of the worker. Announced on DHT. Used to name RabbitMQ queues. Default: Random name.
    * `grapeUrl?` *string* URL to the grape DHT. Default: `http://127.0.0.1:30001`.
    * `port?` *integer* Server port. Default: Random port between 10,000 and 40,000.
    * `callbackSupport?` *boolean* Allows WorkerImplementation functions to be written with callbacks. Disables the method argument count check. Default: false
    * `connection?` *amp.Connection* RabbitMQ connection. Mutually exclusive with `amqpUrl`.
    * `amqpUrl` *string* RabbitMQ connection URL. Mutually exclusive with `connection`. Default: `amqp://localhost:5672`.
    * `deleteInactiveQueueMs` *number* Time in ms after which inactive queues without consumers are deleted. Default: 1 week.
    * `emitsEvents` *boolean* If true, this worker will create the necessary RabbitMQ objects to emit events. Default: false,
    * `namespace` *string* RabbitMQ namespace. All objects like exchanges, queues will start with `{namespace}.`. Default: `blocktank`


**async start()** Starts the worker. Listens on given port.

**async stop()** Stops the worker. Graceful shutdown.

* `options?` *WorkerStopOptions*
    * `cleanupRabbitMq?` *boolean* Deletes all RabbitMQ queues and exchanges that were created by this worker. Used for testing. Default: false.



## Client

`GrenacheClient` allows to call other workers without exposing your own server.

```typescript
import { GrenacheClient } from 'blocktank-worker'
const client = new GrenaceClient()
client.start()

// Method 1 - Call function
const method = 'helloWorld';
const args = ['Sepp', 'Pirmin'];
const response1 = await client.call('MyFirstWorker', method, args)
console.log(response1) // Hello Sepp and Pirmin

// Method 2 - EncapsulatedWorker
const myFirstWorker = client.encapsulateWorker('MyFirstWorker')
const response2 = await myFirstWorker.helloWorld('Sepp', 'Pirmin')
console.log(response2) // Hello Sepp and Pirmin
```

### Class GrenacheClient

**constructor(grapeUrl?)**

* `grapeUrl` *string* URL to the DHT. Default: `http://127.0.0.1:30001`.

**start()** Start DHT connection.

**stop()** Stop DHT connection.


**async call(workerName, method, args?, opts?)** call method of another worker. Returns the worker response.

* `workerName` *string* Name of the worker you want to call.
* `method` *string* Method name you want to call.
* `args?` *any[]* List of arguments. Default: [].
* `opts?`: *Partial GrenacheClientCallOptions*
    * `timeoutMs?` Request timeout in milliseconds. Default: 60,000.

**encapsulateWorker(workerName)** Conveninence wrapper. Returns a worker object that can be called with any worker method.

```typescript
// Example
const myFirstWorker = client.encapsulateWorker('MyFirstWorker')
const response = await myFirstWorker.helloWorld('Sepp', 'Pirmin')
// Hello Sepp and Pirmin
```

## RabbitMQ / Events

`RabbitPublisher` and `RabbitConsumer` manage all events around the worker. 

Events work on a "at least once" delivery basis. 

### Error backoff

Each event can define a custom backoff function in case of an error. 

```typescript
// Default: Math.min(1000 * Math.pow(2, attempt), _1hr)
@SubscribeToBlocktankEvent('lightning', 'invoicePaid', {
    backoffFunction: (attempt) => attempt*1000 
})
async myMethod() {}
```

Checkout [RabbitMQ docs](./docs/rabbitMQ-events.drawio.png) to get an overview on the exchange/queue structure.

### Javascript support

Javascript doesnt support decorators ([yet](https://github.com/tc39/proposal-decorators)). To still subscribe to events, use `registerBlocktankEvent`.

```javascript
const {registerBlocktankEvent} = require('blocktank-worker');

class ListenerImplementation extends WorkerImplementation {
    async invoicePaidEvent(data) {
        return true
    }
}

// Subscribe to the event `lightning.invoicePaid`. Calls ListenerImplementation.invoicePaidEvent.
registerBlocktankEvent('lightning', 'invoicePaid', ListenerImplementation, 'invoicePaidEvent')
```

## Development

- Build: `npm run build`
- Test: `npm run test`. Checkout [vscode jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) to selectively run tests.

