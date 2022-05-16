import { BaseHttpResponseRenderer } from './renderer'
import { useRequest, useResponse, useSetHeaders, useSetCookies } from '../composables'
import { EHttpStatusCode } from '../status-codes'
import { panic } from '../utils/panic'
import { renderCookie, TCookieAttributes } from '../utils/set-cookie'

const defaultStatus: Record<string, EHttpStatusCode> = {
    GET: EHttpStatusCode.OK,
    POST: EHttpStatusCode.Created,
    PUT: EHttpStatusCode.Created,
    PATCH: EHttpStatusCode.Accepted,
    DELETE: EHttpStatusCode.Accepted,
}

const baseRenderer = new BaseHttpResponseRenderer()

export class BaseHttpResponse<BodyType = unknown> {
    constructor(protected renderer: BaseHttpResponseRenderer = baseRenderer) {}

    protected _status: EHttpStatusCode = 0

    protected _body?: BodyType

    protected _headers: Record<string, string | string[]> = {}
    
    get status() {
        return this._status
    }
    
    set status(value: EHttpStatusCode) {
        this._status = value
    }
    
    get body() {
        return this._body
    }
    
    set body(value: BodyType | undefined) {
        this._body = value
    }

    setStatus(value: EHttpStatusCode) {
        this.status = value
        return this
    }

    setBody(value: BodyType) {
        this.body = value
        return this
    }

    getContentType() {
        return this._headers['Content-Type']
    }

    setContentType(value: string) {
        this._headers['Content-Type'] = value
        return this
    }

    setCookie(name: string, value: string, attrs?: Partial<TCookieAttributes>) {
        const cookies = this._headers['Set-Cookie'] = (this._headers['Set-Cookie'] || []) as string[]
        cookies.push(renderCookie(name, { value, attrs: attrs || {} }))
        return this
    }

    setCookieRaw(rawValue: string) {
        const cookies = this._headers['Set-Cookie'] = (this._headers['Set-Cookie'] || []) as string[]
        cookies.push(rawValue)
        return this
    }

    header(name: string, value: string) {
        this._headers[name] = value
        return this
    }

    setHeader(name: string, value: string) {
        return this.header(name, value)
    }

    getHeader(name: string) {
        return this._headers[name]
    }

    protected mergeHeaders() {
        const { headers } = useSetHeaders()
        const { cookies } = useSetCookies()
        const setCookie = [ ...(this._headers['Set-Cookie'] || []), ...cookies()]
        this._headers = {
            ...headers,
            ...this._headers,
            'Set-Cookie': setCookie,
        }
        return this
    }

    protected mergeStatus(renderedBody: string) {
        this.status = this.status || useResponse().status()
        if (!this.status) {
            const { method } = useRequest()
            this.status = renderedBody ? defaultStatus[method as 'GET'] || EHttpStatusCode.OK : EHttpStatusCode.NoContent
        }
        return this
    }

    respond() {
        const { rawResponse, hasResponded } = useResponse()
        if (hasResponded()) {
            throw panic('The response was already sent.')
        }
        this.mergeHeaders()
        const renderedBody = this.renderer.render(this)
        this.mergeStatus(renderedBody)
        const res = rawResponse()
        res.writeHead(this.status, {
            'Content-Length': Buffer.byteLength(renderedBody),
            ...this._headers,
        }).end(renderedBody)
    }
}

