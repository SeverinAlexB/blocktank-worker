export interface GrenacheClientCallOptions {
    timeoutMs: number
}

export const defaultGrenacheClientCallOptions: GrenacheClientCallOptions = {
    timeoutMs: 60*1000 // 60s
}