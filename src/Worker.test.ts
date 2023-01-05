import { Worker } from "./Worker";
import { sleep } from "./utils/sleep";
import { MongoDatabase } from './db/MongoDatabase'


class TestWorker extends Worker {
    async testMethod(name: string) {
        return `hello ${name}`;
    }
    async throwsError() {
        throw new Error('test');
    }

    async main() {
        return 'main';
    }
}


describe('GrapeWorker', () => {
    test('method call', async () => {
        const worker = new TestWorker({
            name: 'test_service'
        });
        try {
            await worker.init();
            await sleep(100); // Wait until the server is announced on Grape
            const response = await worker.callWorker({
                method: 'testMethod',
                args: ['Sepp'],
                service: 'test_service'
            });
            expect(response).toBe('hello Sepp');
        } finally {
            await worker.stop()
        }
    });

    test('main method call', async () => {
        const worker = new TestWorker({
            name: 'test_service'
        });
        try {
            await worker.init();
            await sleep(100); // Wait until the server is announced on Grape
            const response = await worker.callWorker({
                service: 'test_service'
            });
            expect(response).toBe('main');
        } finally {
            await worker.stop()
        }
    });

    test('throwsError method call', async () => {
        const worker = new TestWorker({
            name: 'test_service'
        });
        try {
            await worker.init();
            await sleep(100); // Wait until the server is announced on Grape

            expect(worker.callWorker({
                method: 'throwsError',
                service: 'test_service'
            })).rejects.toThrow(Error);
        } finally {
            await worker.stop()
        }
    });
});



afterEach(async () => {
    await MongoDatabase.close();
});