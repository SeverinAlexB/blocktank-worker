import { Worker } from "./Worker";
import { sleep } from "./utils/sleep";
import { MongoDatabase } from './db/MongoDatabase'


class TestWorker extends Worker {
    async testMethod(name: string, name2: string) {
        return `hello ${name} and ${name2}`;
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
            const response = await worker.call({
                method: 'testMethod',
                args: ['Sepp', 'Pirmin'],
                service: 'test_service'
            });
            expect(response).toBe('hello Sepp and Pirmin');
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
            const response = await worker.call({
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
            expect(worker.call({
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