# Blocktank Worker 

This module is the base class that all microservice workers in Blocktank use. It is written in Typescript but can also be used with javascript.

## Usage

```bash
npm i git+https://github.com/SeverinAlexB/blocktank-worker.git#typescript
```

Run DHT
```bash
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002' &
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001' &  
```

## Worker

A Worker consists of 
* a server that listens on method calls.
* a client that can call other servers.


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
try {
    await runner.start();
    await ctrlC()
} finally {
    await runner.stop()
}

```

### Class WorkerImplementation

* Supports, async and sync and callback functions.
    * If callback functions are used, initialize the Worker with `callbackSupport: true`.
* Automatically returns `Error`s.

**client** *GrenacheClient* to call other workers.


### Class Worker

**constructor(worker, config?)**

* `worker`: *WorkerImplementation*
* `config?` *GrenacheServerConfig*
    * `name?` *string* Name of the worker. Announced on DHT. Must start with `worker:`. Default: Random name.
    * `grapeUrl?` *string* URL to the grape DHT. Default: `http://127.0.0.1:30001`.
    * `port?` *integer* Server port. Default: Random port between 10,000 and 40,000.
    * `callbackSupport?` *boolean* Allows WorkerImplementation functions to be written with callbacks. Disables the method argument count check. Default: false

**async start()** Starts the worker. Listens on given port.

**async stop()** Stops the worker. Graceful shutdown.





## Client

`GrenacheClient` allows you to call other workers without exposing your own server.

```typescript
import { GrenacheClient } from 'blocktank-worker'
const client = new GrenaceClient()
client.start()

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
const worker = client.encapsulateWorker('worker:MyFirstWorker')
const response = await worker.helloWorld('Sepp')
// Hello Sepp
```

## Development

- Build: `npm run build`
- Test: `npm run test`. Checkout [vscode jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) to selectively run tests.

