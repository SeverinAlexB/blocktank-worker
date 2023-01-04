import { SyncRunner } from './SyncRunner';
import { sleep } from './sleep';

describe('SyncRunner', () => {
    test('1 execution', async () => {
        const runner = new SyncRunner();
        const result = await runner.run('lock1', async () => {
            return 1 + 1;
        });
        expect(result).toBe(2);
    });

    test('2 sync executions', async () => {
        const runner = new SyncRunner();
        await runner.run('lock1', async () => {
            await sleep(10);
        });
        const result = await runner.run('lock1', async () => {
            return 2;
        });
        expect(result).toBe(2);
    });

    test('Rate limit', async () => {
        const runner = new SyncRunner();
        runner.run('lock1', async () => {
            // Long running task that will block/rate limit the next task
            await sleep(300);
        });
        expect(runner.run('lock1', async () => {
            return 1 + 1;
        })).rejects.toThrow(Error);
    });
});


