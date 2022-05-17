import { useHeaders, useResponse } from '../composables'
import { BaseHttpResponse } from '../response'
import { panic } from '../utils/panic'
import { TCookieAttributes } from '../utils/set-cookie'

import { promises as fsPromises, createReadStream, Stats } from 'fs'
const { stat } = fsPromises
import path from 'path'
import { convertTime } from '../utils/time'
import { getMimeType } from '../mime'
import { restoreCurrentHttpContex, useCurrentHttpContext } from '../composables/core'
import { ProstoHttpError } from '../errors'

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

export class ServeFile extends BaseHttpResponse {
    constructor(protected path: string, protected options: TServeFileOptions = {}) { 
        super()
    }

    async respond() {
        const ctx = useCurrentHttpContext()
        const { rawResponse, hasResponded } = useResponse()
        if (hasResponded()) {
            throw panic('The response was already sent.')
        }

        const file = path.normalize(
            path.join(
                process.cwd(),
                this.options.baseDir || '',
                this.path
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
        if (this.options.weakEtag) {
            etag = `W/${etag}`
        }

        const headers = useHeaders()
        console.log({headers})
        if (headers['if-none-match'] && headers['if-none-match'] === etag) {
            this.setStatus(304)
            const res = rawResponse()
            res.writeHead(this.status, {
                ...this._headers,
            })
            res.end()
        }

        this.setHeader('etag', etag)

        if (this.options.headers) {
            for (const header of Object.keys(this.options.headers)) {
                this.setHeader(header, this.options.headers[header])
            }
        }

        if (this.options.maxAge !== undefined) {
            this.setHeader('Cache-Control', 'public, max-age=' + convertTime(this.options.maxAge, 's').toString())
        }

        this.setHeader('Content-Type', getMimeType(file) || 'application/octet-stream')

        this.mergeHeaders()
        this.setStatus(200)
        const res = rawResponse()
        res.writeHead(this.status, {
            'Content-Length': s.size,
            ...this._headers,
        })

        const stream = createReadStream(file)

        stream.on('error', (err) => {
            stream.destroy()
            res.end()
        })
        stream.on('close', () => {
            stream.destroy()
        })

        stream.pipe(res)
    }
}
