import { WorkerNameType } from "../WorkerNameType"
import { GrenacheClient } from "../client/Client"
import { Worker } from "./Worker"
import { BlocktankEventEmitter } from "./events/Emitter"
import { BlocktankEventListener } from "./events/Listener"
import { EventManager } from "./events/Manager"

/**
 * Base class for all worker implementations.
 * This class is used to implement the worker logic.
 * It is separated from the Worker class to prevent calls to internal methods.
 */
export class WorkerImplementation {
  public runner: Worker // Set by the Worker class



  main(): any {
    throw new Error('main() method called without implementation.')
  }
}

