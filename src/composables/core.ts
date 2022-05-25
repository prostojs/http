import { TProstoParamsType } from '@prostojs/router'
import { IncomingMessage, ServerResponse } from 'http'
import { panic } from '../utils/panic'

export interface TCurrentHttpContext {
    req: IncomingMessage
    res: ServerResponse
    params: TProstoParamsType
    customContext: THttpCustomContext
}

let currentHttpContext: TCurrentHttpContext | null = null

export type THttpCustomContext = Record<string, unknown>

export function useCurrentHttpContext() {
    if (!currentHttpContext) {
        throw panic('Use HTTP hooks only synchronously within the runtime of the request.')
    }
    const cc = currentHttpContext
    return {
        getCtx: () => cc,
        restoreCtx: () => setCurrentHttpContext(cc.req, cc.res, cc.params, cc.customContext),
    }
}

export function clearCurrentHttpContext() {
    currentHttpContext = null
}

export function setCurrentHttpContext(req: IncomingMessage, res: ServerResponse, params: TProstoParamsType, customContext: THttpCustomContext) {
    currentHttpContext = { req, res, params, customContext }
}

type TInnerCacheObjects = 'searchParams' | 'cookies' | 'accept' | 'authorization' | 'setHeader' | 'setCookies' | 'status' | 'response' | 'body'

export function useCacheObject<T = unknown>(name: TInnerCacheObjects): T {
    const cc = useCurrentHttpContext().getCtx().customContext
    const cache = cc['__' + name] = (cc['__' + name] || {}) as T
    return cache
}

export function clearCacheObject(name: TInnerCacheObjects) {
    const cc = useCurrentHttpContext().getCtx().customContext
    const o = cc['__' + name]
    switch (typeof o) {
        case 'object':
            if (Array.isArray(o)) {
                o.splice(0, o.length)
            } else {
                for (const key in o) {
                    delete o[key as keyof typeof o]
                }
            }
            break
        case 'string': 
            cc['__' + name] = ''
            break
        default: cc['__' + name] = {}
    }
}
