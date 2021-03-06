import { IncomingHttpHeaders } from 'http'
import { useCacheObject } from './core'
import { useRequest } from './req-res'

export function useHeaders(): IncomingHttpHeaders {
    return useRequest().headers
}

export function useSetHeaders() {
    const cache = useCacheObject<Record<string, string>>('setHeader')
    
    function setHeader(name: string, value: string | number) {
        cache[name] = value.toString()
    }

    function removeHeader(name: string) {
        delete cache[name]
    }

    function setContentType(value: string) {
        setHeader('Content-Type', value)
    }

    function enableCors(origin: string = '*') {
        setHeader('Access-Control-Allow-Origin', origin)
    }

    return {
        setHeader,
        removeHeader,
        setContentType,
        headers: cache,
        enableCors,
    }
}
