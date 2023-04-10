import { WorkerRunner } from "./WorkerRunner"

export class ServiceWorker {
  public runner: WorkerRunner

  async main() {
    console.log('main method called without implementation')
  }
}

