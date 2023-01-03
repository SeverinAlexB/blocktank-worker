import { promises as fs } from 'fs';
import * as path from 'path';

interface StatusFileConfig {
  tag: string,
  postfix: string
}


export class StatusFile {
  public statusFile: string;
  private _data: any;
  constructor (public config: StatusFileConfig) {
    this.statusFile = path.join(process.cwd(), `./status/${config.tag}.${config.postfix}.json`)
    this._data = {}
  }

  async loadFile (init: any): Promise<any> {
    try {
      const file = await fs.readFile(this.statusFile);
      const f = JSON.parse(file.toString())
      return f
    } catch (err) {
      await this.updateFile(init)
    }
  }

  updateFile (data: any) {
    this._data = data
    return fs.writeFile(this.statusFile, JSON.stringify(data))
  }

  get data () {
    return this._data || {}
  }
}

