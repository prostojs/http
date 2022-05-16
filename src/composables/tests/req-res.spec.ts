import { setCurrentHttpContext } from '../core'
import { useRequest, useResponse, useRouteParams } from '../req-res'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

describe('compasble/req-res', () => {
    const req = new IncomingMessage(new Socket({}))
    req.url='test.com/path?a[]=1&a[]=2&b=3&c=4&encoded=%7e%20%25'
    const res = new ServerResponse(req)
    const params = {
        a: 'a1',
        b: 'b2',
        c: ['1', '2', '3'],
    }

    beforeEach(() => {
        setCurrentHttpContext(req, res, params, {})
    })

    it('must return request', () => {
        const { rawRequest, headers, method } = useRequest()
        expect(rawRequest).toBe(req)
        expect(headers).toBe(req.headers)
        expect(method).toBe(req.method)
    })

    it('must return response', () => {
        const { rawResponse } = useResponse()
        expect(rawResponse()).toBe(res)
    })

    it('must return route-params', () => {
        const { routeParams, getRouteParam } = useRouteParams()
        expect(routeParams).toBe(params)
        expect(getRouteParam('a')).toEqual('a1')
    })
})
