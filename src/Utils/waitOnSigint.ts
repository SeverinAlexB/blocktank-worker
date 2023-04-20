export default async function waitOnSigint() {
    return new Promise((resolve, reject) => {
        // Wait on CTRL+C
        process.on('SIGINT', async function () {
            resolve(undefined)
        });
    })
}