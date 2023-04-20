export interface GrenacheClientCallOptions {
    timeoutMs: number,
    sourceWorkerName?: string
}

export const defaultGrenacheClientCallOptions: GrenacheClientCallOptions = {
    timeoutMs: 60*1000, // 60s
}