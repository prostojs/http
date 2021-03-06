import { convertTime, TProstoTimeMultiString } from '../utils/time'
import { renderCacheControl, TCacheControl } from '../utils/cache-control'
import { useSetHeaders } from './headers'

const renderAge = (v: number | TProstoTimeMultiString) => convertTime(v, 's').toString()
const renderExpires = (v: Date | string | number) => (typeof v === 'string' || typeof v === 'number' ? new Date(v).toUTCString() : v.toUTCString())
const renderPragmaNoCache = (v: boolean) => v ? 'no-cache' : ''

// rfc7234#section-5.2.2
export function useSetCacheControl() {
    const { setHeader } = useSetHeaders()

    const setAge = (value: number | TProstoTimeMultiString) => {
        setHeader('Age', renderAge(value))
    }

    const setExpires = (value: Date | string | number) => {
        setHeader('Expires', renderExpires(value))
    }

    const setPragmaNoCache = (value: boolean = true) => {
        setHeader('Pragma', renderPragmaNoCache(value))
    }

    const setCacheControl = (data: TCacheControl) => {
        setHeader('Cache-Control', renderCacheControl(data))
    }

    return {
        setExpires,
        setAge,
        setPragmaNoCache,
        setCacheControl,
    }
}
