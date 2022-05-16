import { TProstoParamsType } from '@prostojs/router'
import { useRequest } from './req-res'
import { useCacheObject } from './core'
import { ProstoURLSearchParams } from '../utils/url-search-params'

type TSearchParamsCache = {
    raw?: string
    parsed?: TProstoParamsType
    urlSearchParams?: ProstoURLSearchParams
}

export function useSearchParams() {
    const url = useRequest().url || ''
    const cache = useCacheObject<TSearchParamsCache>('searchParams')

    function rawSearchParams() {
        if (typeof cache.raw === 'undefined') {
            const i = url.indexOf('?')
            cache.raw = i >=0 ? url.slice(i) : ''
        }
        return cache.raw
    }

    function urlSearchParams(): ProstoURLSearchParams {
        if (!cache.urlSearchParams) {
            cache.urlSearchParams = new ProstoURLSearchParams(rawSearchParams())
        }
        return cache.urlSearchParams
    }

    return {
        rawSearchParams, 
        urlSearchParams,
        jsonSearchParams: () => urlSearchParams().toJson(),
    }
}
