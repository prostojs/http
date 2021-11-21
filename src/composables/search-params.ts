import { TProstoParamsType } from '@prostojs/router'
import { useRequest } from './req-res'
import { URLSearchParams } from 'url'
import { useCacheObject } from './core'

type TSearchParamsCache = {
    raw?: string
    parsed?: TProstoParamsType
    urlSearchParams?: URLSearchParams
}

export function useSearchParams() {
    const url = useRequest().url || ''
    const cache = useCacheObject<TSearchParamsCache>('searchParams')

    function isArrayParam(name: string) {
        return name.endsWith('[]')
    }

    function rawSearchParams() {
        if (typeof cache.raw === 'undefined') {
            const i = url.indexOf('?')
            cache.raw = i >=0 ? url.slice(i) : ''
        }
        return cache.raw
    }

    function urlSearchParams(): URLSearchParams {
        if (!cache.urlSearchParams) {
            cache.urlSearchParams = new URLSearchParams(rawSearchParams())
        }
        return cache.urlSearchParams
    }
    
    function getSearchParam<T extends string | string[] | null = string | string[] | null>(name: string): T {
        if (isArrayParam(name)) return urlSearchParams().getAll(name) as T
        return urlSearchParams().get(name) as T
    }

    function getAllSearchParams<T extends TProstoParamsType = TProstoParamsType>(): T {
        if (!cache.parsed) {
            cache.parsed = {}
            for (const [key, value] of urlSearchParams().entries()) {
                if (isArrayParam(key)) {
                    const a = cache.parsed[key] = (cache.parsed[key] || []) as string[]
                    a.push(value)
                } else {
                    cache.parsed[key] = value
                }
            }
        }
        return cache.parsed as T
    }

    return {
        rawSearchParams, 
        urlSearchParams,
        getSearchParam,
        getAllSearchParams,
    }
}
