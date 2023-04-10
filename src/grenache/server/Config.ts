import { ServiceNameType } from "../ServiceNameType"

export interface GrenacheServerConfig {
    /**
     * Grape DHT url. Default: 'http://127.0.0.1:30001'
     */
    grapeUrl: string,
    /**
     * Port that the server listens on. If not specified, a random port will be used.
     */
    port: number,
    /**
     * Name of the service. If not specified, a random name will be used.
     */
    name: ServiceNameType,

    /**
     * If true, the server will support callbacks. This will disable the method argument count check
     * and you MUST call the callback function otherwise the request will timeout.
     * Default: false.
     */
    callbackSupport: boolean
  }
  
export const defaultGrenacheServerConfig: GrenacheServerConfig = {
  grapeUrl: 'http://127.0.0.1:30001',
  port: Math.ceil(Math.random() * 10000 + 30000),
  name: `srv:pinotNoir${Math.ceil(Math.random() * 100000)}`,
  callbackSupport: false
}