import { ServiceNameType } from "../ServiceNameType";
import { GrenacheClientCallOptions } from "./CallOptions";
import { GrenacheClient } from "./Client";


/**
 * Helper class to encapsulate a service name and a client.
 */
export class EncapsulatedServiceClient {
    constructor(public serviceName: ServiceNameType, public client: GrenacheClient) {}

    async call(method: string, args: any[] = [], opts: Partial<GrenacheClientCallOptions> = {}): Promise<any> {
        return this.client.call(this.serviceName, method, args, opts);
    }

    static construct(serviceName: ServiceNameType, client: GrenacheClient): any {
        const encapsulated = new EncapsulatedServiceClient(serviceName, client);
        return allowAllFunctions(encapsulated);
    }
}

/**
 * Translates every generic function method to service.call(method, args)
 * @param service 
 * @returns 
 */
function allowAllFunctions(service: EncapsulatedServiceClient) {
    let handler = {
        get(target: EncapsulatedServiceClient, functionName: string) {
            return function (...args: any[]) {
                return target.call(functionName, args)
            };
        }
    };
    return new Proxy(service, handler);
}