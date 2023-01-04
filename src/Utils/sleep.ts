export async function sleep(miliseconds: number) {
    return new Promise((resolve, _) => {
        setTimeout(() =>{
            resolve(miliseconds);
        }, miliseconds)
    })
}