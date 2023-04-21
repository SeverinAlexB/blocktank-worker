import { WorkerImplementation } from "./WorkerImplementation";
import { Worker } from "./Worker";
import { sleep } from "../../utils";
import GrenacheClientCallError, { GrenacheClientCallErrorCodes } from "../client/CallError";


class Implementation extends WorkerImplementation {
    async sleep(milliseconds: number) {
        await sleep(milliseconds)
        return true
    }

    method(name: string) {
        return `hello ${name}`;
    }

    methodCallback(name: string, callback: (err: any, data: any) => void) {
        callback(null, `hello ${name}`);
    }


}

// Make sure to run Grape DHT before running this test

jest.setTimeout(60 * 1000)


describe('Worker', () => {

    test('Undefined method name', async () => {
        const worker = new Implementation()
        const runner = new Worker(worker);
        try {
            await runner.start();
            await runner.gClient.call(runner.config.name, 'undefinedMethod');
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        } finally {
            await runner.stop()
        }
    });

    test('Wrong number of arguments', async () => {
        const worker = new Implementation()
        const runner = new Worker(worker);
        try {
            await runner.start();
            await runner.gClient.call(runner.config.name, 'method', ['Sepp', 'Primin']);
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        } finally {
            await runner.stop()
        }
    });

    test('Wrong number of arguments - callback support', async () => {
        const worker = new Implementation()
        const runner = new Worker(worker, {callbackSupport: true});
        try {
            await runner.start();
            const response = await runner.gClient.call(runner.config.name, 'methodCallback', ['Sepp']);
            expect(response).toEqual('hello Sepp');
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.ESOCKETTIMEDOUT)
        } finally {
            await runner.stop()
        }
    });

    test('Hit method timeout', async () => {
        const worker = new Implementation()
        const runner = new Worker(worker);
        try {
            await runner.start();
            await runner.gClient.call(runner.config.name, 'sleep', [1000], { timeoutMs: 500 });
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.ESOCKETTIMEDOUT)
        } finally {
            await runner.stop()
        }
    });

    test('Hit connect timeout', async () => {
        const worker = new Implementation()
        const runner = new Worker(worker);
        await runner.start();
        await runner.stop()
        try {
            await runner.gClient.call(runner.config.name, 'undefienedMethod');
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.ERR_REQUEST_GENERIC)
        } finally {
            await runner.stop()
        }
    });

    test('Unknown worker', async () => {
        const worker = new Implementation()
        const runner = new Worker(worker);
        await runner.start();
        try {
            await runner.gClient.call('worker:UnknownWorker', 'undefienedMethod');
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.WORKER_NOT_FOUND)
        } finally {
            await runner.stop()
        }
    });
});

