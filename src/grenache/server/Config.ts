import { WorkerNameType } from "../WorkerNameType"

export interface GrenacheServerConfig {
    /**
     * Grape DHT url. Default: 'http://127.0.0.1:30001'
     */
    grapeUrl: string,
    /**
     * Port that the server listens on. Default: Random port between 10,000 and 40,000.
     */
    port: number,
    /**
     * Name of the service. Default: Random name.
     */
    name: WorkerNameType,

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
  name: `worker:pinotNoir${Math.ceil(Math.random() * 100000)}`,
  callbackSupport: false
}