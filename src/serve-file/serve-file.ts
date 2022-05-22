import { useHeaders, useRequest, useResponse, useSetHeaders } from '../composables'
import { TCookieAttributes } from '../utils/set-cookie'

import { promises as fsPromises, createReadStream, Stats } from 'fs'
const { stat } = fsPromises
import path from 'path'
import { convertTime } from '../utils/time'
import { getMimeType } from '../mime'
import { restoreCurrentHttpContex, useCurrentHttpContext } from '../composables/core'
import { ProstoHttpError } from '../errors'
import { Readable } from 'stream'

interface TServeFileOptions {
    headers?: Record<string, string>
    maxAge?: TCookieAttributes['maxAge']
    baseDir?: string
    defaultExt?: string
}

export function statFile(path: string) {
    return stat(path)
}

export async function serveFile(filePath: string, options: TServeFileOptions = {}): Promise<Readable | string> {
    const ctx = useCurrentHttpContext()

    const normalizedPath = path.normalize(
        path.join(
            process.cwd(),
            options.baseDir || '',
            filePath
        ))

    let fileStats: Stats
    try {    
        fileStats = await stat(normalizedPath)
    } catch (e) {
        throw new ProstoHttpError(404)
    }
    if (fileStats.isDirectory()) {
        // TODO: handle directory
        throw new ProstoHttpError(404)
    }

    restoreCurrentHttpContex(ctx)

    const { status } = useResponse()
    const { setHeader } = useSetHeaders()
    const headers = useHeaders()
    const { method } = useRequest()

    status(200)

    // if-none-match & if-modified-since processing start
    // rfc7232
    const etag = `"${[fileStats.ino, fileStats.size, fileStats.mtime.toISOString()].join('-')}"`
    const lastModified = new Date(fileStats.mtime)
    if (isNotModified(etag, lastModified, headers['if-none-match'] || '', headers['if-modified-since'] || '')) {
        status(304)
        return ''
    }
    // if-none-match & if-modified-since processing end

    // range header processing start
    let range = headers.range
    let start, end
    let size = fileStats.size
    if (range) {
        const rangeParts = range.trim().replace(/bytes=/, '').split('-')
        const [s, e] = rangeParts
        start = parseInt(s)
        end = e ? parseInt(e) : (size - 1)
        end = Math.min(size - 1, end)
        if (start > end || isNaN(start) || isNaN(end)) {
            throw new ProstoHttpError(416)
        }
        size = (end - start) + 1

        // if-range processing start
        // rfc7233#section-3.2\
        const ifRange = headers['if-range'] as string || ''
        const ifRangeTag = ifRange[0] === '"' ? ifRange : ''
        const ifRangeDate = ifRangeTag ? '' : ifRange
        if (ifRange && !isNotModified(etag, lastModified, ifRangeTag, ifRangeDate)) {
            // If the validator does not match, the server MUST ignore
            // the Range header field.
            status(200)
            size = fileStats.size
            range = ''
        } else {
            // If the validator given in the If-Range header field matches the
            // current validator for the selected representation of the target
            // resource, then the server SHOULD process the Range header field as
            // requested.
            setHeader('Content-Range', `bytes ${start}-${end}/${fileStats.size}`)
            status(206)
        }
        // if-range processing end
    }
    // range header processing end

    setHeader('Accept-Ranges', 'bytes')
    setHeader('etag', etag)
    setHeader('Last-Modified', lastModified.toUTCString())

    if (options.maxAge !== undefined) {
        setHeader('Cache-Control', 'public, max-age=' + convertTime(options.maxAge, 's').toString())
    }

    setHeader('Content-Type', getMimeType(normalizedPath) || 'application/octet-stream')
    setHeader('Content-Length', size)

    if (options.headers) {
        for (const header of Object.keys(options.headers)) {
            setHeader(header, options.headers[header])
        }
    }

    return method === 'HEAD' ? '' : createReadStream(normalizedPath, !!range ? { start, end } : undefined)
}

// function toWeak(etag: string): string {
//     return `W/${etag}`
// }

function isNotModified(etag: string, lastModified: Date, clientEtag: string, clientLM: string): boolean {
    if (clientEtag) {
        const parts = clientEtag.split(',').map(v => v.trim())
        for (const p of parts) {
            if (etag === p) {
                return true
            }
        }
        // A recipient MUST ignore If-Modified-Since if the request contains an
        // If-None-Match header field; the condition in If-None-Match is
        // considered to be a more accurate replacement for the condition in
        // If-Modified-Since, and the two are only combined for the sake of
        // interoperating with older intermediaries that might not implement
        // If-None-Match.
        return false
    }
    const date = new Date(clientLM)
    // A recipient MUST ignore the If-Modified-Since header field if the
    // received field-value is not a valid HTTP-date, or if the request
    // method is neither GET nor HEAD.
    if (date.toString() !== 'Invalid Date' && date.getTime() > lastModified.getTime())
    {
        return true
    }
    return false
}

