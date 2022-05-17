import { useHeaders, useResponse, useSetHeaders } from '../composables'
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
    weakEtag?: boolean
}

export function statFile(path: string) {
    return stat(path)
}

export async function ServeFile(filePath: string, options: TServeFileOptions = {}): Promise<Readable | string> {
    const ctx = useCurrentHttpContext()
    const { status } = useResponse()
    const { setHeader } = useSetHeaders()

    const file = path.normalize(
        path.join(
            process.cwd(),
            options.baseDir || '',
            filePath
        ))

    let s: Stats
    try {    
        s = await stat(file)
    } catch (e) {
        throw new ProstoHttpError(404)
    }
    if (s.isDirectory()) {
        // TODO: handle directory
        throw new ProstoHttpError(404)
    }

    restoreCurrentHttpContex(ctx)
    let etag = `"${[s.ino, s.size, s.mtime.toISOString()].join('-')}"`
    if (options.weakEtag) {
        etag = `W/${etag}`
    }

    const headers = useHeaders()
    if (headers['if-none-match'] && headers['if-none-match'] === etag) {
        status(304)
        return ''
    }

    setHeader('etag', etag)

    if (options.headers) {
        for (const header of Object.keys(options.headers)) {
            setHeader(header, options.headers[header])
        }
    }

    if (options.maxAge !== undefined) {
        setHeader('Cache-Control', 'public, max-age=' + convertTime(options.maxAge, 's').toString())
    }

    setHeader('Content-Type', getMimeType(file) || 'application/octet-stream')
    setHeader('Content-Length', s.size)

    status(200)

    return createReadStream(file)
}

