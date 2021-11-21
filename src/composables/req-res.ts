import { TProstoParamsType } from '@prostojs/router'
import { EHttpStatusCode } from '../status-codes'
import { useCacheObject, useCurrentHttpContext } from './core'

export function useRequest() {
    const statusCache = useCacheObject<{ code: EHttpStatusCode }>('status')
    const bodyCache = useCacheObject<{ value: Promise<Buffer> }>('body')
    const { req, customContext } = useCurrentHttpContext()

    function status(code?: EHttpStatusCode) {
        if (code) {
            statusCache.code = code
        }
        return statusCache.code
    }

    async function rawBody() {
        if (typeof bodyCache.value === 'undefined') {
            bodyCache.value = new Promise((resolve, reject) => {
                let body = Buffer.from('')
                req.on('data', function(chunk) {
                    body = Buffer.concat([body, chunk])
                })
                req.on('error', function(err) {
                    reject(err)
                })
                req.on('end', function() {
                    resolve(body)
                })
            })
        }
        return bodyCache.value
    }

    return {
        rawRequest: req,
        url: req.url,
        method: req.method,
        headers: req.headers,
        status,
        rawBody,
        customContext,
    }
}

type TUseResponseOptions = {
    passthrough: boolean
}

export function useResponse() {
    const cache = useCacheObject<{ responded: boolean }>('response')
    const res = useCurrentHttpContext().res

    const rawResponse = (options?: TUseResponseOptions) => {
        if (!options?.passthrough) cache.responded = true
        return res
    }

    const hasResponded = () => cache.responded

    return {
        rawResponse,
        hasResponded,
    }
}

export function useRouteParams<T extends TProstoParamsType = TProstoParamsType>() {
    const routeParams = useCurrentHttpContext().params as T

    function getRouteParam<T2 extends string | string[] | undefined = string | string[] | undefined>(name: string) {
        return routeParams[name] as T2
    }

    return {
        routeParams,
        getRouteParam,
    }
}
