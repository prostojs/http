import { setCurrentHttpContext } from '../core'
import { useHeaders, useSetHeaders } from '../headers'
import { useAccept } from '../header-accept'
import { useAuthorization } from '../header-authorization'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

describe('composables/headers useHeaders', () => {
    const req = new IncomingMessage(new Socket({}))
    req.headers.accept = 'application/json; text/html'
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })

    it('must return req.headers', () => {
        const headers = useHeaders()
        expect(headers).toBe(req.headers)
    })

    it('must parse "accept" header', () => {
        const {
            accept,
            accepts,
            acceptsJson,
            acceptsXml,
            acceptsText,
            acceptsHtml,
        } = useAccept()
        expect(accept).toEqual(req.headers.accept)
        expect(accepts('application/json')).toEqual(true)
        expect(accepts('text/plain')).toEqual(false)
        expect(accepts('text/html')).toEqual(true)
        expect(acceptsJson()).toEqual(true)
        expect(acceptsXml()).toEqual(false)
        expect(acceptsText()).toEqual(false)
        expect(acceptsHtml()).toEqual(true)
    })

    it('must parse "auth" header with bearer', () => {
        req.headers.authorization = 'Bearer ABCDEFG'
        const {
            authorization,
            authType,
            authRawCredentials,
            isBasic,
            isBearer,
            basicCredentials,
        } = useAuthorization()
        
        expect(authorization).toEqual(req.headers.authorization)
        expect(authType()).toEqual('Bearer')
        expect(authRawCredentials()).toEqual('ABCDEFG')
        expect(isBasic()).toEqual(false)
        expect(isBearer()).toEqual(true)
        expect(basicCredentials()).toBeUndefined()
    })

    it('must parse "auth" header with basic auth', () => {
        req.headers.authorization = 'Basic bG9naW46cGFzc3dvcmQ='
        const {
            authorization,
            authType,
            authRawCredentials,
            isBasic,
            isBearer,
            basicCredentials,
        } = useAuthorization()
        
        expect(authorization).toEqual(req.headers.authorization)
        expect(authType()).toEqual('Basic')
        expect(authRawCredentials()).toEqual('bG9naW46cGFzc3dvcmQ=')
        expect(isBasic()).toEqual(true)
        expect(isBearer()).toEqual(false)
        expect(basicCredentials()).toEqual({ username: 'login', password: 'password' })
    })
})

describe('composables/headers useSetHeaders', () => {
    const req = new IncomingMessage(new Socket({}))
    req.headers.accept = 'application/json'
    req.headers['content-type'] = 'application/json'
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })

    it('must setContentType', () => {
        const { setContentType, headers } = useSetHeaders()
        setContentType('text/plain')
        expect(headers).toEqual({ 'Content-Type': 'text/plain' })
    })
    it('must set random header', () => {
        const { setHeader, headers } = useSetHeaders()
        setHeader('my-header', '1234')
        expect(headers).toHaveProperty('my-header')
        expect(headers['my-header']).toEqual('1234')
    })
})
