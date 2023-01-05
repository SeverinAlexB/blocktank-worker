
export interface ServerCallRequest {
    method?: string,
    args: any[],
    service: string
}


type MethodName = Lowercase<string>;
type ServiceName = Lowercase<string>;

type ServiceMethod = `svc:${ServiceName}:${MethodName}`;
