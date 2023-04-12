import { WorkerNameType } from "../WorkerNameType"
import { GrenacheClient } from "../client/Client"
import { Worker } from "./Worker"
import { BlocktankListener } from "./events/EventSubscription"
import { BlocktankSubscription } from "./events/BlocktankSubscription"
import { SubscriptionManager } from "./events/SubscriptionManager"

/**
 * Base class for all worker implementations.
 * This class is used to implement the worker logic.
 * It is separated from the Worker class to prevent calls to internal methods.
 */
export class WorkerImplementation {
  public runner: Worker // Set by the Worker class
  public subscriptions: SubscriptionManager // Set by the Worker class

  get name(): string {
    return this.runner.config.name
  }

  get client(): GrenacheClient {
    return this.runner.gClient
  }

  _subscribeToEvents(workerName: WorkerNameType, names: string[]) {
    this.subscriptions.addSubscription(workerName, names)
    return true
  }

  async _emitEvent(eventName: string, args: any[]) {
    await this.subscriptions.call(eventName, args)
  }

  main(): any {
    throw new Error('main() method called without implementation.')
  }
}

