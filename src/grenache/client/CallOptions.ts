export interface GrenacheClientCallOptions {
    timeoutMs: number,
    isEvent: boolean
    sourceWorkerName?: string
}

export const defaultGrenacheClientCallOptions: GrenacheClientCallOptions = {
    timeoutMs: 60*1000, // 60s
    isEvent: false
}