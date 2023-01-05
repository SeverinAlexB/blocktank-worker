# Blocktank Worker 

This module is the base class that all microservice workers in Blocktank use. It is written in Typescript but can also be used with javascript.


## Usage

```bash
npm i git+https://github.com/SeverinAlexB/blocktank-worker.git#typescript
```

### Define and start worker

```typescript
import { Worker } from 'blocktank-worker';

class ExchangeRateWorker extends Worker {
    constructor() {
        super({name: 'exchange_rate'});
    }

    async helloWorld(name1: string, name2: string) {
        return `Hello ${name1} and ${name2}`;
    }
}

const worker = new ExchangeRateWorker();
await worker.init();
```

### Call worker method

```typescript
const response = await worker.call({
                method: 'helloWorld',
                service: 'exchange_rate',
                args: ['Sepp', 'Pirmin']
            });
console.log(response) // Hello Sepp and Pirmin
```

## Development

- Build: `npm run build`
- Test: `npm run test`. Checkout [vscode jest](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest) to selectively run tests.

