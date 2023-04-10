import { ServiceWorker } from "./ServiceWorker";
import { WorkerRunner } from "./WorkerRunner";
import { sleep } from "../../utils";


class TestWorker extends ServiceWorker {
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


describe('ServiceWorker', () => {
    test('sync method call', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker);
        try {
            await runner.start();
            const response = await runner.call(runner.config.name, 'syncMethod', ['Sepp']);
            expect(response).toBe('hello Sepp');
        } finally {
            await runner.stop()
        }
    });

    test('sync error method call', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker);
        try {
            await runner.start();
            await sleep(1000)
            await runner.call(runner.config.name, 'syncMethodError', ['Sepp']);
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toEqual('Hello Sepp')
        } finally {
            await runner.stop()
        }
    });

    test('async method call', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker);
        try {
            await runner.start();
            const response = await runner.call(runner.config.name, 'asyncMethod', ['Sepp']);
            expect(response).toBe('hello Sepp');
        } finally {
            await runner.stop()
        }
    });

    test('async error method call', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker);
        try {
            await runner.start();
            await sleep(1000)
            await runner.call(runner.config.name, 'asyncMethodError', ['Sepp']);
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toEqual('Hello Sepp')
        } finally {
            await runner.stop()
        }
    });

    test('callback method call', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker, {callbackSupport: true});
        try {
            await runner.start();
            const response = await runner.call(runner.config.name, 'callbackMethod', ['Sepp']);
            expect(response).toBe('hello Sepp');
        } finally {
            await runner.stop()
        }
    });

    test('callback error method call', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker, {callbackSupport: true});
        try {
            await runner.start();
            await sleep(1000)
            await runner.call(runner.config.name, 'callbackMethodError', ['Sepp']);
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toEqual('Hello Sepp')
        } finally {
            await runner.stop()
        }
    });
});

