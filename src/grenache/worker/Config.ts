import { RabbitConsumerOptions, defaultRabbitConsumerOptions } from "../../rabbitMq/RabbitCosumerOptions";
import { GrenacheServerConfig, defaultGrenacheServerConfig } from "../server/Config";

/**
 * Configuration for a blocktank worker.
 */
export interface BlocktankWorkerConfig extends GrenacheServerConfig, RabbitConsumerOptions {
  /**
   * Describes if this worker emits events and therefore creates a RabbitMQ exchange.
   */
  emitsEvents: boolean
}

/**
 * Needs to be a function because it needs to generate a random port and name on every call.
 * @returns Default configuration for a blocktank worker.
 */
export function defaultBlocktankWorkerConfig(): BlocktankWorkerConfig {
    return {
      ...defaultGrenacheServerConfig(),
      ...defaultRabbitConsumerOptions,
      emitsEvents: false
    }
  }