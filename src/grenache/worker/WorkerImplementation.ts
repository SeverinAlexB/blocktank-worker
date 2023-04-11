import { GrenacheClient } from "../client/Client"
import { Worker } from "./Worker"

/**
 * Base class for all service implementation.
 * This class is used to implement the worker logic.
 * It is separated from the Worker class to prevent calls to internal methods.
 */
export class WorkerImplementation {
  public runner: Worker

  get name(): string {
    return this.runner.config.name
  }

  get client(): GrenacheClient {
    return this.runner.gClient
  }

  main(): any {
    throw new Error('main() method called without implementation.')
  }
}

