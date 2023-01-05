import { GrapeWorker } from "./GrapeWorker";
import { sleep } from "./utils/sleep";
import { MongoDatabase } from './db/MongoDatabase'


class TestWorker extends GrapeWorker {
    async testMethod(name: string) {
        return `hello ${name}`;
    }
}

jest.setTimeout(10000)
describe('GrapeWorker', () => {
    test('1 execution', async () => {
        
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
});



afterEach(async () => {
    await MongoDatabase.close();
});