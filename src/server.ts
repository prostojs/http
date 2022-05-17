import { ProstoRouter, THttpMethod, TProstoLookupResult, TProstoParamsType } from '@prostojs/router'
import { IncomingMessage, Server, ServerResponse } from 'http'
import { ProstoHttpError } from '.'
import { clearCurrentHttpContext, setCurrentHttpContext, THttpCustomContext } from './composables/core'
import { createServer } from './http'
import { createResponseFrom } from './response'
import { TProstoHttpHandler, TProstoServerOptions } from './types'
import { panic } from './utils/panic'

export class ProstoHttpServer {
    protected router: ProstoRouter<TProstoHttpHandler>
    
    protected server?: Server

    protected _uncoughtExceptionHandler: (error: Error) => void

    constructor(private options?: TProstoServerOptions) {
        this.router = new ProstoRouter()
        this._uncoughtExceptionHandler = ((err: Error) => {
            this.printError('Uncought exception: ', err)
        }).bind(this)
    }

    public listen(port: number): Promise<void>

    public listen(port: number, cb: () => void): Promise<void>

    public listen(port: number, hostname: string): Promise<void>

    public listen(port: number, hostname: string, cb: () => void): Promise<void>

    public listen(port: number, hostname?: string | (() => void) , cb?: () => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const myCb = () => {
                const fn = typeof hostname === 'function' ? hostname : cb
                process.on('uncaughtException', this._uncoughtExceptionHandler)
                if (fn) { fn() }
                this.server?.off('error', reject)
                resolve()
            }
            try {
                this.server = createServer(
                    {
                        port,
                    },
                    this.processRequest.bind(this),
                    typeof hostname === 'string' ? hostname : '',
                    myCb,
                )
                this.server?.on('error', reject)
            } catch(e) {
                reject(e)
            }
        })
    }

    public close() {
        return new Promise((resolve, reject) => {
            this.server?.close((err) => {
                if (err) return reject(err)
                process.off('uncaughtException', this._uncoughtExceptionHandler)
                resolve(this.server)
            })
        })
    }

    protected processRequest(req: IncomingMessage, res: ServerResponse) {
        const found = this.router.lookup(req.method as THttpMethod, req.url as string)
        const ctx: THttpCustomContext = {
            __setHeader: {
                Server: '@prostojs/http v' + __VERSION__,
            },
        }
        if (found) {
            const params = found.ctx.params
            function setContext() {
                setCurrentHttpContext(req, res, params, ctx)
            }
            function clearContext() {
                clearCurrentHttpContext()
            }
            this.processHandlers(req, res, found, setContext, clearContext)
                // .then(() => {
                //     console.log('ok')
                // })
                .catch((e) => {
                    this.printError('Internal error, please report: ', e as Error)
                    setContext()
                    createResponseFrom(e)?.respond()
                    clearContext()
                    console.error(e)
                })
                // .finally(() => {
                //     console.log('done')
                // })
        } else {
            // not found
            setCurrentHttpContext(req, res, {}, ctx)
            createResponseFrom(new ProstoHttpError(404))?.respond()
            clearCurrentHttpContext()
        }
    }

    protected async processHandlers(req: IncomingMessage, res: ServerResponse, found: TProstoLookupResult<TProstoHttpHandler>, setContext: () => void, clearContext: () => void) {
        for (const [i, handler] of found.route.handlers.entries()) {
            const last = found.route.handlers.length === i + 1
            try {
                setContext()
                const promise = handler()
                clearContext()
                const result = await promise
                if (!last && result instanceof Error) continue
                setContext()
                await (createResponseFrom(result)?.respond() || Promise.resolve())
                clearContext()
                break
            } catch (e) {
                this.printError('Uncought route handler exception: ' + (req.url || '') + '\n', e as Error)
                if (last) {
                    setContext()
                    await (createResponseFrom(e)?.respond() || Promise.resolve())
                    clearContext()
                }
            }
        }
    }

    printError(expl: string, e: Error) {
        if (!(e instanceof ProstoHttpError)) {
            panic(expl + e.message)
            console.error(__DYE_RED__ + (e.stack || '') + __DYE_COLOR_OFF__)
        }
    }

    get<ResType = unknown, ParamsType = TProstoParamsType>(path: string, handler: TProstoHttpHandler<ResType>) {
        return this.router.on<ParamsType, TProstoHttpHandler>('GET', path, handler)
    }

    post<ResType = unknown, ParamsType = TProstoParamsType>(path: string, handler: TProstoHttpHandler<ResType>) {
        return this.router.on<ParamsType, TProstoHttpHandler>('POST', path, handler)
    }

    put<ResType = unknown, ParamsType = TProstoParamsType>(path: string, handler: TProstoHttpHandler<ResType>) {
        return this.router.on<ParamsType, TProstoHttpHandler>('PUT', path, handler)
    }

    delete<ResType = unknown, ParamsType = TProstoParamsType>(path: string, handler: TProstoHttpHandler<ResType>) {
        return this.router.on<ParamsType, TProstoHttpHandler>('DELETE', path, handler)
    }

    patch<ResType = unknown, ParamsType = TProstoParamsType>(path: string, handler: TProstoHttpHandler<ResType>) {
        return this.router.on<ParamsType, TProstoHttpHandler>('PATCH', path, handler)
    }

    on<ResType = unknown, ParamsType = TProstoParamsType>(method: THttpMethod | '*', path: string, handler: TProstoHttpHandler<ResType>) {
        return this.router.on<ParamsType, TProstoHttpHandler>(method, path, handler)
    }
}
