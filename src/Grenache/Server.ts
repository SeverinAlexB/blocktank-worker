import { GrapeServerConfig } from "./GrapeServerConfig"

const Link = require('grenache-nodejs-link')
const { PeerRPCServer } = require('grenache-nodejs-http')


export class GranacheServer {
  public peer: typeof PeerRPCServer;
  public link: typeof Link;
  public service: any;
  constructor(public config: GrapeServerConfig){}

  public init() {
    if (this.config.test_env) return
    this.link = new Link({
      grape: this.config.grape || 'http://127.0.0.1:30001'
    })
    this.link.start()
  
    const peer = new PeerRPCServer(this.link, {
      timeout: 300000
    })
    peer.init()
    this.service = peer.transport('server')
    this.service.listen(this.config.port || 8999)
    this.link.announce(this.config.name, this.service.port, {})
  }

  public stop() {
    if (this.service) {
      this.service.unlisten();
    }
    if (this.peer) {
      this.peer.stop();
    }
    if (this.link) {
      this.link.stop();
    }
  }
}
