import { ServiceWorker } from "./ServiceWorker";
import { WorkerRunner } from "./WorkerRunner";
import { sleep } from "../../utils";
import GrenacheClientCallError, { GrenacheClientCallErrorCodes } from "../client/CallError";


class TestWorker extends ServiceWorker {
    async sleep() {
        await sleep(10 * 1000)
        return "1"
    }


}


jest.setTimeout(60 * 1000)


describe('WorkerRunner', () => {

    test('Undefined method name', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker);
        try {
            await runner.start();
            await runner.call(runner.config.name, 'undefinedMethod');
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.ESOCKETTIMEDOUT)
        } finally {
            await runner.stop()
        }
    });

    test('Hit method timeout', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker);
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
        const runner = new WorkerRunner(worker);
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

    test('Unknown service', async () => {
        const worker = new TestWorker()
        const runner = new WorkerRunner(worker);
        await runner.start();
        try {
            await runner.call('srv:UnknownService', 'undefienedMethod');
            expect(false).toBe(true);
        } catch (e) {
            expect(e).toBeInstanceOf(GrenacheClientCallError)
            expect((e as GrenacheClientCallError).code).toEqual(GrenacheClientCallErrorCodes.SERVICE_NOT_FOUND)
        } finally {
            await runner.stop()
        }
    });
});

