
import { ServiceNameType } from "../ServiceNameType";
import { defaultGrenacheServerConfig } from "../server/Config";
import { MethodCallOptions } from "../server/MethodCallOptions";
import GrenacheClientCallError, { GrenacheClientCallErrorCodes } from "./CallError";
import { defaultGrenacheClientCallOptions, GrenacheClientCallOptions } from "./CallOptions";

const Link = require('grenache-nodejs-link')
const { PeerRPCClient } = require('grenache-nodejs-http')


export class GrenacheClient {
  public peer: typeof PeerRPCClient;
  public link: typeof Link;

  constructor (public grapeUrl: string = defaultGrenacheServerConfig.grapeUrl) {
    this.link = new Link({
      grape: grapeUrl
    })
    this.peer = new PeerRPCClient(this.link, {})
  }

  init() {
    this.link.start()
    this.peer.init()
  }


  /**
   * Call another worker
   * @param params 
   * @returns 
   */
  call(serviceName: ServiceNameType, method: string, args: any[] = [], opts: Partial<GrenacheClientCallOptions> = {}): Promise<any> {
    opts = Object.assign({}, defaultGrenacheClientCallOptions, opts)

    const params: MethodCallOptions = {
      method: method,
      args: args,
      service: serviceName,
    }

    return new Promise((resolve, reject) => {
      this.peer.request(serviceName, params, { timeout: opts.timeoutMs }, (err: any, data: any) => {
        if (!err) {
          resolve(data)
        }
        
        const hasErrorMessage = typeof err?.message === 'string' || err?.message instanceof String
        if (!hasErrorMessage) {
          return reject(err); // Other type of error, throw directly
        }
        if (err.message.includes('ERR_GRAPE_LOOKUP_EMPTY')) {
          return reject(new GrenacheClientCallError(GrenacheClientCallErrorCodes.SERVICE_NOT_FOUND, 'Cannot find service. ' + err.message))
        } else if (err.message.includes('ESOCKETTIMEDOUT')) {
          return reject(new GrenacheClientCallError(GrenacheClientCallErrorCodes.ESOCKETTIMEDOUT, 'Timeout calling service. ' + err.message))
        } else if (err.message.includes('ERR_REQUEST_GENERIC')) {
          return reject(new GrenacheClientCallError(GrenacheClientCallErrorCodes.ERR_REQUEST_GENERIC, 'Timeout calling. ' + err.message))
        }

        reject(err);
      })
    });
  }

  public stop() {
    this.link.stop();
    this.peer.stop();
  }
}
