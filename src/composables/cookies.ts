import { useHeaders } from './headers'
import { escapeRegex, safeDecodeURIComponent } from '@prostojs/router'
import { clearCacheObject, useCacheObject } from './core'
import { renderCookie, TCookieAttributes, TSetCookieData } from '../utils/set-cookie'

type TCookiesCache = Record<string, string | null>
type TSetCookieCache = Record<string, TSetCookieData>

export function useCookies() {
    const cache = useCacheObject<TCookiesCache>('cookies')
    const { cookie } = useHeaders()
    
    function getCookie(name: string) {
        if (typeof cache[name] === 'undefined') {
            if (cookie) {
                const result = new RegExp(`(?:^|; )${escapeRegex(name)}=(.*?)(?:;?$|; )`, 'i').exec(cookie)
                cache[name] = result && result[1] ? safeDecodeURIComponent(result[1]) : null
            } else {
                cache[name] = null
            }
        }
        return cache[name]
    }

    return {
        rawCookies: cookie,
        getCookie,
    }
}

export function useSetCookies() {
    const cache = useCacheObject<TSetCookieCache>('setCookies')

    function setCookie(name: string, value: string, attrs?: Partial<TCookieAttributes>) {
        cache[name] = {
            value,
            attrs: attrs || {},
        }
    }

    function cookies(): string[] {
        return Object.entries(cache).map(([key, value]) => renderCookie(key, value))
    }

    function removeCookie(name: string) {
        delete cache[name]
    }

    function clearCookies() {
        clearCacheObject('setCookies')
    }

    return {
        setCookie,
        removeCookie,
        clearCookies,
        cookies,
    }
}
