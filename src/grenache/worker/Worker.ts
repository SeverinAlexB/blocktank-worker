import { ServiceRunner } from "./Runner"

/**
 * Base class for all service workers.
 */
export class ServiceWorker {
  public runner: ServiceRunner

  get name(): string {
    return this.runner.config.name
  }

  main() {
    throw new Error('main method called without implementation.')
  }
}

