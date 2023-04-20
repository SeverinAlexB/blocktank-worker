import * as amp from 'amqplib'


export interface RabbitConnectionOptions {
    /**
     * RabbitMq connection url. This will create a new TCP connection to the server.
     * Mutually exclusive with connection.
     */
    amqpUrl: string;
    /**
     * RabbitMq connection. This will use the existing connection.
     * Mutually exclusive with amqpUrl.
     */
    connection: amp.Connection
}

export const defaultRabbitConnectionOptions: RabbitConnectionOptions = {
    amqpUrl: 'amqp://localhost:5672',
    connection: undefined
}