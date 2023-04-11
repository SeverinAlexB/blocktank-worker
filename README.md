# Blocktank Worker 

This module is the base class that all microservice workers in Blocktank use. It is written in Typescript but can also be used with javascript.


## Usage

```bash
npm i git+https://github.com/SeverinAlexB/blocktank-worker.git#typescript
```

### Worker

A Worker consists of 
* a server that listens on method calls.
* a client that can call other servers.

It is the class you will be using the most.

```typescript
import { Worker, WorkerImplementation } from 'blocktank-worker';

class MyFirstWorkerImplemetation extends WorkerImplementation {
    // Every method defined in here can be called by other workers/clients.
    async helloWorld(name1: string, name2: string) {
        return `Hello ${name1} and ${name2}`;
    }

    // Every worker also contains a GrenacheClient to call other worker methods.
    async usdToBtc(usd: number) {
        const exchangeRate = this.client.encapsulateWorker('worker:exchange_rate') // Get exchangeRate worker
        const btcUsd = await exchangeRate.getRate("BTCUSD") // Call method on exchangeRate worker.
        console.log('Current BTCUSD price is', btcUsd) 
        // Current BTCUSD price is $30,000
        return usd/btcUsd
    }
}

const runner = new Worker(new MyFirstWorkerImplemetation(), {
    name: 'worker:MyFirstWorker'
})
await runner.start();
```

#### Class WorkerImplementation

* Supports, async and sync and callback functions.
    * If callback functions are used, initialize the Worker with `callbackSupport: true`.
* Automatically returns `Error`s.

**client**: `GrenacheClient` to call other workers.


#### Class Worker

**constructor(worker, config?)**

* `worker` <WorkerImplementation>
* `config?` <GrenacheServerConfig>
    * `name` <string> Name of the worker. Announced on DHT. Must start with `worker:`. Default: Random name like `worker:pinotNoir92703`.
    * `grapeUrl?` <string> URL to the grape DHT. Default: `http://127.0.0.1:30001`.
    * `port?` <integer> Server port. Default: Random port between 10,000 and 40,000.
    * `callbackSupport` <boolean> Allows WorkerImplementation functions to be written with callbacks. Disables the method argument count check. Default: false

**async start()** Starts the worker. Listens on given port.

**async stop()** Stops the worker. Graceful shutdown.





### Client

`GrenacheClient` allows you to call other workers without exposing your own methods.

```typescript
import { GrenacheClient } from 'blocktank-worker'
const client = new GrenaceClient()

// Method 1 - Call function
const method = 'helloWorld';
const args = ['Sepp', 'Pirmin'];
const response1 = await client.call('worker:MyFirstWorker', method, args)
console.log(response1) // Hello Sepp and Pirmin

// Method 2 - EncapsulatedWorker
const myFirstWorker = client.encapsulateWorker('worker:MyFirstWorker')
const response2 = await myFirstWorker.helloWorld('Sepp', 'Pirmin')
console.log(response2) // Hello Sepp and Pirmin
```




## Development

- Build: `npm run build`
- Test: `npm run test`. Checkout [vscode jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) to selectively run tests.

