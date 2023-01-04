import {Mutex, MutexInterface, Semaphore, SemaphoreInterface, tryAcquire, withTimeout} from 'async-mutex';

/**
 * Makes sure a method is run only once at the time. Throws an error if it is already running.
 */
export class SyncRunner {
    private mutexes: Map<string, MutexInterface> = new Map();

    constructor(public defaultTimeoutS: number = 60) {}

    private getMutex(lockName: string): MutexInterface {    
        if (!this.mutexes.has(lockName)) {
            const mutex = withTimeout(
                new Mutex(new Error('Rate limited')), this.defaultTimeoutS);
            this.mutexes.set(lockName, mutex);
        }
        return this.mutexes.get(lockName);
    }
    
    public async run<T>(lockName: string, func: () => Promise<T>): Promise<T> {
        const mutex = this.getMutex(lockName);
        await tryAcquire(mutex).acquire()
        try {
            const result = await func();
            return result;
        } finally {
            mutex.release();
        }
    }
}