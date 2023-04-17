import { WorkerImplementation } from "./WorkerImplementation";
import { Worker } from "./Worker";
import { sleep } from "../../utils";


class TestImplementation extends WorkerImplementation {
    async asyncMethod(name: String) {
        return `hello ${name}`;
    }

    async asyncMethodError(name: string) {
        throw new Error(`Hello ${name}`);
    }

    syncMethod(name: string) {
        return `hello ${name}`;
    }

    syncMethodError(name: string) {
        throw new Error(`Hello ${name}`);
    }

    callbackMethod(name: string, callback: (err: any, data: any) => void) {
        callback(null, `hello ${name}`);
    }

    callbackMethodError(name: string, callback: (err: any, data?: any) => void) {
        callback(new Error(`Hello ${name}`));
    }
}


jest.setTimeout(60*1000)


describe('WorkerImplementation', () => {
    test('sync method call', async () => {
        const runner = new Worker(new TestImplementation());
        try {
            await runner.start();
            const response = await runner.gClient.call(runner.config.name, 'syncMethod', ['Sepp']);
            expect(response).toBe('hello Sepp');
        } finally {
            await runner.stop()
        }
    });

    test('sync error method call', async () => {
        const runner = new Worker(new TestImplementation());
        try {
            await runner.start();
            await sleep(1000)
            await runner.gClient.call(runner.config.name, 'syncMethodError', ['Sepp']);
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toEqual('Hello Sepp')
        } finally {
            await runner.stop()
        }
    });

    test('async method call', async () => {
        const runner = new Worker(new TestImplementation());
        try {
            await runner.start();
            const response = await runner.gClient.call(runner.config.name, 'asyncMethod', ['Sepp']);
            expect(response).toBe('hello Sepp');
        } finally {
            await runner.stop()
        }
    });

    test('async error method call', async () => {
        const runner = new Worker(new TestImplementation());
        try {
            await runner.start();
            await sleep(1000)
            await runner.gClient.call(runner.config.name, 'asyncMethodError', ['Sepp']);
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toEqual('Hello Sepp')
        } finally {
            await runner.stop()
        }
    });

    test('callback method call', async () => {
        const runner = new Worker(new TestImplementation(), {callbackSupport: true});
        try {
            await runner.start();
            const response = await runner.gClient.call(runner.config.name, 'callbackMethod', ['Sepp']);
            expect(response).toBe('hello Sepp');
        } finally {
            await runner.stop()
        }
    });

    test('callback error method call', async () => {
        const runner = new Worker(new TestImplementation(), {callbackSupport: true});
        try {
            await runner.start();
            await sleep(1000)
            await runner.gClient.call(runner.config.name, 'callbackMethodError', ['Sepp']);
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toEqual('Hello Sepp')
        } finally {
            await runner.stop()
        }
    });

    test('encapsulated worker', async () => {
        const runner = new Worker(new TestImplementation());
        try {
            await runner.start();
            const worker = runner.gClient.encapsulateWorker(runner.config.name);
            const response = await worker.syncMethod('Sepp')
            expect(response).toBe('hello Sepp');
        } finally {
            await runner.stop()
        }
    });
});

