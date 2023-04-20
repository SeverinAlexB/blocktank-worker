import { Worker } from "./Worker"


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

