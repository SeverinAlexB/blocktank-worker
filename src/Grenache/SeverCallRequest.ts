
export interface ServerCallRequest {
    method?: string,
    args?: any[],
    service: string,
    timeoutMs?: number,
}


type MethodName = Lowercase<string>;
type ServiceName = Lowercase<string>;

type ServiceMethod = `svc:${ServiceName}:${MethodName}`;
