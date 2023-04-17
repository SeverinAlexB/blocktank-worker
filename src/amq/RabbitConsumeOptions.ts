
export interface RabbitConsumeOptions {
    /**
     * Provide a backoff function to control when the message should be retries in case of an error.
     * @param attempt Number of previous attempts. First message is always 0.
     * @returns 
     */
    backoffFunction: (attempt: number) => number
}

export const defaultRabbitConsumeOptions: RabbitConsumeOptions = {
    backoffFunction: (attempt: number) => {
        const exponential = Math.min(1000 * Math.pow(2, attempt), 30000)
        const max1Hour = 60 * 60 * 1000
        return Math.min(exponential, max1Hour)
    }
}