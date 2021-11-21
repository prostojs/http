import { useHeaders } from './headers'
import { contentTypes } from '../content-types'
import { useCacheObject } from './core'

export function useAccept() {
    const { accept } = useHeaders()
    const cache = useCacheObject<Record<string, boolean>>('accept')
    const accepts = (mime: string) => {
        if (typeof cache[mime] !== 'boolean') {
            cache[mime] = !!(accept && (accept === '*/*' || accept.indexOf(mime) >= 0))
        }
        return cache[mime]
    }
    return {
        accept,
        accepts,
        acceptsJson: () => accepts(contentTypes.application.json),
        acceptsXml:  () => accepts(contentTypes.application.xml),
        acceptsText: () => accepts(contentTypes.text.plain),
        acceptsHtml: () => accepts(contentTypes.text.html),
    }
}
