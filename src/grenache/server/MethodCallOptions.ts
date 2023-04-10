import { ServiceNameType } from "../ServiceNameType";

export interface MethodCallOptions {
    method: string,
    args: any[],
    service: ServiceNameType,
}

