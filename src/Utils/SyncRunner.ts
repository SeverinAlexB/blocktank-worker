import {Mutex, MutexInterface, Semaphore, SemaphoreInterface, tryAcquire, withTimeout} from 'async-mutex';

export class SyncRunner {
    // Makes sure a method is run only once at the time.
    private mutexes: Map<string, MutexInterface> = new Map();

    constructor(public defaultTimeoutS: number = 60) {}

    private getMutex(lockName: string): MutexInterface {    
        if (!this.mutexes.has(lockName)) {
            const mutex = tryAcquire(withTimeout(
                new Mutex(new Error('Rate limited')), this.defaultTimeoutS));
            this.mutexes.set(lockName, mutex);
        }
        return this.mutexes.get(lockName);
    }
    
    public async run<T>(lockName: string, func: () => Promise<T>): Promise<T> {
        const mutex = this.getMutex(lockName);
        mutex.acquire()

        try {
            const result = await func();
            return result;
        } finally {
            mutex.release();
        }
    }
}