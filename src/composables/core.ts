import { TProstoParamsType } from '@prostojs/router'
import { IncomingMessage, ServerResponse } from 'http'
import { panic } from '../utils/panic'

let currentHttpContext: {
    req: IncomingMessage
    res: ServerResponse
    params: TProstoParamsType
    customContext: THttpCustomContext
} | null = null

export type THttpCustomContext = Record<string, unknown>

export function clearCurrentHttpContext() {
    currentHttpContext = null
}

export function setCurrentHttpContext(req: IncomingMessage, res: ServerResponse, params: TProstoParamsType, customContext: THttpCustomContext) {
    currentHttpContext = { req, res, params, customContext }
}

export function useCurrentHttpContext() {
    if (!currentHttpContext) {
        throw panic('Use HTTP hooks only synchronously within the runtime of the request.')
    }
    return currentHttpContext
}

type TInnerCacheObjects = 'searchParams' | 'cookies' | 'accept' | 'authorization' | 'setHeader' | 'setCookies' | 'status' | 'response' | 'body'

export function useCacheObject<T = unknown>(name: TInnerCacheObjects): T {
    const cc = useCurrentHttpContext().customContext
    const cache = cc['__' + name] = (cc['__' + name] || {}) as T
    return cache
}

export function clearCacheObject(name: TInnerCacheObjects) {
    const cc = useCurrentHttpContext().customContext
    cc['__' + name] = {}
}
