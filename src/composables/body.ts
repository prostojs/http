import { useHeaders } from './headers'
import { useCacheObject } from './core'
import { contentTypes } from '../content-types'
import { panic } from '../utils/panic'
import { compressors, TBodyCompressor, uncompressBody } from '../utils/body'
import { useRequest } from './req-res'
import { URLSearchParams } from 'url'
import { EHttpStatusCode, ProstoHttpError } from '..'

type TBodyCache = { 
    parsed?: unknown
    isJson?: boolean
    isHtml?: boolean
    isText?: boolean
    isXml?: boolean
    isFormData?: boolean
    isUrlencoded?: boolean
    isCompressed?: boolean
    contentEncodings?: string[]
}

export function useBody() {
    const cache = useCacheObject<TBodyCache>('body')
    const { rawBody } = useRequest()
    const { 'content-type': contentType, 'content-encoding': contentEncoding } = useHeaders()

    function contentIs(type: string) {
        return (contentType || '').indexOf(type) >= 0
    }

    function isJson() {
        if (typeof cache.isJson === 'undefined') {
            cache.isJson = contentIs(contentTypes.application.json)
        }
        return cache.isJson
    }

    function isHtml() {
        if (typeof cache.isHtml === 'undefined') {
            cache.isHtml = contentIs(contentTypes.text.html)
        }
        return cache.isHtml
    }

    function isXml() {
        if (typeof cache.isXml === 'undefined') {
            cache.isXml = contentIs(contentTypes.text.xml)
        }
        return cache.isXml
    }

    function isText() {
        if (typeof cache.isText === 'undefined') {
            cache.isText = contentIs(contentTypes.text.plain)
        }
        return cache.isText
    }

    function isFormData() {
        if (typeof cache.isFormData === 'undefined') {
            cache.isFormData = contentIs('multipart/form-data')
        }
        return cache.isFormData
    }

    function isUrlencoded() {
        if (typeof cache.isUrlencoded === 'undefined') {
            cache.isUrlencoded = contentIs(contentTypes.application.xWwwFormUrlencoded)
        }
        return cache.isUrlencoded
    }

    function isCompressed() {
        if (typeof cache.isCompressed === 'undefined') {
            const parts = contentEncodings()
            for (const p of parts) {
                cache.isCompressed = ['deflate', 'gzip', 'br'].includes(p)
                if (cache.isCompressed) break
            }
        }
        return cache.isCompressed
    }

    function contentEncodings() {
        if (typeof cache.contentEncodings === 'undefined') {
            cache.contentEncodings = (contentEncoding || '').split(',').map(p => p.trim()).filter(p => !!p)
        }
        return cache.contentEncodings
    }

    async function parseBody<T = unknown>() {
        if (typeof cache.parsed === 'undefined') {
            const body = await uncompressBody(contentEncodings(), (await rawBody()).toString())
            if (isJson()) { cache.parsed = jsonParser(body) }
            else if (isFormData()) { cache.parsed = formDataParser(body) }
            else if (isUrlencoded()) { cache.parsed = urlEncodedParser(body) }
            else { cache.parsed = textParser(body) }
        }
        return cache.parsed as T
    }

    function jsonParser(v: string): Record<string, unknown> | unknown[] {
        return JSON.parse(v) as Record<string, unknown> | unknown[]
    }
    function textParser(v: string): string {
        return v
    }

    function formDataParser(v: string): Record<string, unknown> {
        const boundary = '--' + ((/boundary=([^;]+)(?:;|$)/.exec(contentType || '') || [, ''])[1] as string)
        if (!boundary) throw new ProstoHttpError(EHttpStatusCode.BadRequest, 'form-data boundary not recognized')
        const parts = v.trim().split(boundary)
        const result: Record<string, unknown> = {}
        let key = ''
        let partContentType = 'text/plain'
        for (const part of parts) {
            parsePart()
            key = ''
            partContentType = 'text/plain'
            let valueMode = false
            const lines = part.trim().split(/\n/g).map(s => s.trim())
            for (const line of lines) {
                if (valueMode) {
                    if (!result[key]) {
                        result[key] = line
                    } else {
                        result[key] += '\n' + line
                    }
                } else {
                    if (!line || line === '--') {
                        valueMode = !!key
                        if (valueMode) {
                            key = key.replace(/^["']/, '').replace(/["']$/, '')
                        }
                        continue
                    }
                    if (line.toLowerCase().startsWith('content-disposition: form-data;')) {
                        key = (/name=([^;]+)/.exec(line) || [])[1]
                        if (!key) throw new ProstoHttpError(EHttpStatusCode.BadRequest, 'Could not read multipart name: ' + line)
                        continue
                    }
                    if (line.toLowerCase().startsWith('content-type:')) {
                        partContentType = (/content-type:\s?([^;]+)/i.exec(line) || [])[1]
                        if (!partContentType) throw new ProstoHttpError(EHttpStatusCode.BadRequest, 'Could not read content-type: ' + line)
                        continue
                    }
                }
            }
        }
        parsePart()
        function parsePart() {
            if (key) {
                if (partContentType.indexOf(contentTypes.application.json) >= 0) {
                    result[key] = JSON.parse(result[key] as string)
                }
            }
        }
        return result
    }

    function isArrayParam(name: string) {
        return name.endsWith('[]')
    }

    function urlEncodedParser(v: string): Record<string, unknown> {
        const params = new URLSearchParams(v.trim())
        const result: Record<string, unknown> = {}
        for (const [key, value] of params.entries()) {
            if (isArrayParam(key)) {
                const a = result[key] = (result[key] || []) as string[]
                a.push(value)
            } else {
                result[key] = value
            }
        }
        return result
    }

    return {
        isJson,
        isHtml,
        isXml,
        isText,
        isFormData,
        isUrlencoded,
        isCompressed,
        parseBody,
    }
}

export function registerBodyCompressor(name: string, compressor: TBodyCompressor) {
    if (compressors[name]) {
        throw panic(`Body compressor "${name}" already registered.`)
    }
    compressors[name] = compressor
}
