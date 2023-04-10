import { GrenacheServerConfig, defaultGrenacheServerConfig } from "./Config";


const Link = require('grenache-nodejs-link')
const { PeerRPCServer } = require('grenache-nodejs-http')


export class GrenacheServer {
  public peer: typeof PeerRPCServer;
  public link: typeof Link;
  public service: any;
  public config: GrenacheServerConfig;

  constructor(config: Partial<GrenacheServerConfig>){
    this.config = Object.assign({}, defaultGrenacheServerConfig, config)
  }

  public init() {
    this.link = new Link({
      grape: this.config.grapeUrl
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
