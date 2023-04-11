import { WorkerImplementation } from "./WorkerImplementation";
import { Worker } from "./Worker";
import { sleep } from "../../utils";
import GrenacheClientCallError, { GrenacheClientCallErrorCodes } from "../client/CallError";


class TestWorker extends WorkerImplementation {
    async sleep() {
        await sleep(10 * 1000)
        return "1"
    }

    method(name: string) {
        return `hello ${name}`;
    }

    methodCallback(name: string, callback: (err: any, data: any) => void) {
        callback(null, `hello ${name}`);
    }


}


jest.setTimeout(60 * 1000)


describe('Worker', () => {

    test('Undefined method name', async () => {
        const worker = new TestWorker()
        const runner = new Worker(worker);
        try {
            await runner.start();
            await runner.call(runner.config.name, 'undefinedMethod');
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        } finally {
            await runner.stop()
        }
    });

    test('Wrong number of arguments', async () => {
        const worker = new TestWorker()
        const runner = new Worker(worker);
        try {
            await runner.start();
            await runner.call(runner.config.name, 'method', ['Sepp', 'Primin']);
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        } finally {
            await runner.stop()
        }
    });

    test('Wrong number of arguments - callback support', async () => {
        const worker = new TestWorker()
        const runner = new Worker(worker, {callbackSupport: true});
        try {
            await runner.start();
            const response = await runner.call(runner.config.name, 'methodCallback', ['Sepp']);
            expect(response).toEqual('hello Sepp');
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.ESOCKETTIMEDOUT)
        } finally {
            await runner.stop()
        }
    });

    test('Hit method timeout', async () => {
        const worker = new TestWorker()
        const runner = new Worker(worker);
        try {
            await runner.start();
            await runner.call(runner.config.name, 'sleep', [], { timeoutMs: 1000 });
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.ESOCKETTIMEDOUT)
        } finally {
            await runner.stop()
        }
    });

    test('Hit connect timeout', async () => {
        const worker = new TestWorker()
        const runner = new Worker(worker);
        await runner.start();
        await runner.stop()
        try {
            await runner.call(runner.config.name, 'undefienedMethod');
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.ERR_REQUEST_GENERIC)
        } finally {
            await runner.stop()
        }
    });

    test('Unknown worker', async () => {
        const worker = new TestWorker()
        const runner = new Worker(worker);
        await runner.start();
        try {
            await runner.call('worker:UnknownWorker', 'undefienedMethod');
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.SERVICE_NOT_FOUND)
        } finally {
            await runner.stop()
        }
    });
});

