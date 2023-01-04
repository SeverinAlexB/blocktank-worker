import { GrapeWorker } from "./GrapeWorker";
import { sleep } from "./utils/sleep";


class TestWorker extends GrapeWorker {
    async testMethod(name: string) {
        return `hello ${name}`;
    }
}

describe('GrapeWorker', () => {
    test('1 execution', async () => {
        const worker = new TestWorker({
            name: 'test_service'
        });
        await worker.init();
        await sleep(100); // Wait until the server is announced on Grape
        const response = await worker.callWorker({
            method: 'testMethod',
            args: ['Sepp'],
            service: 'test_service'
        });
        
        console.log('response', response);

    });
});



