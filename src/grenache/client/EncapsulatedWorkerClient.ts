import { WorkerNameType } from "../WorkerNameType";
import { GrenacheClientCallOptions } from "./CallOptions";
import { GrenacheClient } from "./Client";


/**
 * Helper class to encapsulate a service name and a client.
 */
export class EncapsulatedWorkerClient {
    constructor(public serviceName: WorkerNameType, public client: GrenacheClient) {}

    async call(method: string, args: any[] = [], opts: Partial<GrenacheClientCallOptions> = {}): Promise<any> {
        return this.client.call(this.serviceName, method, args, opts);
    }

    static construct(serviceName: WorkerNameType, client: GrenacheClient): any {
        const encapsulated = new EncapsulatedWorkerClient(serviceName, client);
        return allowAllFunctions(encapsulated);
    }
}

/**
 * Translates every generic function method to service.call(method, args)
 * @param service 
 * @returns 
 */
function allowAllFunctions(service: EncapsulatedWorkerClient) {
    let handler = {
        get(target: EncapsulatedWorkerClient, functionName: string) {
            return function (...args: any[]) {
                return target.call(functionName, args)
            };
        }
    };
    return new Proxy(service, handler);
}