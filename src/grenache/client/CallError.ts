export enum GrenacheClientCallErrorCodes {
    TIMEOUT = 'ERR_TIMEOUT',
    ESOCKETTIMEDOUT = 'ESOCKETTIMEDOUT',
    WORKER_NOT_FOUND = 'ERR_GRAPE_LOOKUP_EMPTY',
    ERR_REQUEST_GENERIC = 'ERR_REQUEST_GENERIC',
}


export default class GrenacheClientCallError extends Error {
    constructor(public code: GrenacheClientCallErrorCodes, message: string) {
        super(message);
    }
}