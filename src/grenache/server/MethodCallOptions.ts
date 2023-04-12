import { WorkerNameType } from "../WorkerNameType"

export interface MethodCallOptions {
    sourceWorkerName?: WorkerNameType,
    method: string,
    args: any[],
    isEvent?: boolean
}

