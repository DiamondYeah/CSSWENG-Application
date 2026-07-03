
// If called, function does a promise setTimeout to wait given how many ms is given in the parameter
// Useful for making a timeout/timer between different parts of code
export async function timer(ms: number): Promise<void>{

    return new Promise((res) => setTimeout(res, ms));

}