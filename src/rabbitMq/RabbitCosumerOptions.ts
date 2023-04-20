import { RabbitConnectionOptions, defaultRabbitConnectionOptions } from "./RabbitConnectionOptions";

export interface RabbitConsumerOptions extends RabbitConnectionOptions {
    /**
     * Delete the queue when there is no consumer for this queue for this amount of time.
     * -1 meants never delete the queue. Default: 1 week
     */
    deleteInactiveQueueMs: number
}

const _1Week = 1000 * 60 * 60 * 24 * 7 * 1;
export const defaultRabbitConsumerOptions: RabbitConsumerOptions = {
    ...defaultRabbitConnectionOptions,
    deleteInactiveQueueMs: _1Week
}