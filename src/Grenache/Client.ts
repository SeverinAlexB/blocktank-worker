import { GrapeServerConfig } from "./GrapeServerConfig"

const Link = require('grenache-nodejs-link')
const { PeerRPCClient } = require('grenache-nodejs-http')

export interface ServerCallParams {
  method: string,
  args: any[]
}

export class GrenacheClient {
  public peer: typeof PeerRPCClient;

  constructor (config: GrapeServerConfig) {
    if (config.test_env) return
    const link = new Link({
      grape: config.grape || 'http://127.0.0.1:30001'
    })
    link.start()

    this.peer = new PeerRPCClient(link, {})
    this.peer.init()
  }

  //
  // Call another worker
  // @name: Name of the worker
  // @params.method: Method of the worker
  // @params.args: arguments passed to the worker
  send(name: string, params: ServerCallParams, callback?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.peer.request(name, params, { timeout: 600000 }, (err: any, data: any) => {
        if (err && err.message.includes('ERR_GRAPE_LOOKUP_EMPTY')) {
          console.log('Cannot find service', name, params)
        }
        if (err && err.message.includes('ESOCKETTIMEDOUT')) {
          console.log('Timedout calling', name, params.method)
        }
        if (err && err.message.includes('ERR_REQUEST_GENERIC')) {
          console.log('Timedout calling', name, params.method)
        }
        if (err && err.message.includes('ERR_GRAPE_LOOKUP_EMPTY')) {
          console.log('Cannot find service', name, err.message)
        }
        if (callback) {
          callback(err, data);
        }
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    });

  }

  // No idea if this is still in use?
  //
  // createNotifier (name: string, swarmId: any, p1: any) {
  //   return (p2: any, callback: any) => {
  //     this.send(name, { params: { ...p1, ...p2 }, swarm_id: swarmId }, callback)
  //   }
  // }
}
