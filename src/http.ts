import http, { RequestListener } from 'http'

export interface THttpOptions {
    port: number    
}

export function createServer(opts: THttpOptions, cb: RequestListener) {
    const server = http.createServer(cb)
    server.listen(opts.port)
    return server
}
