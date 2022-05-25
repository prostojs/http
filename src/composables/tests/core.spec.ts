import { setCurrentHttpContext, clearCurrentHttpContext, useCurrentHttpContext, useCacheObject, clearCacheObject } from '../core'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

describe('composables/core', () => {
    const req = new IncomingMessage(new Socket({}))
    const res = new ServerResponse(req)
    const cache = {__body: 'some data'}
    setCurrentHttpContext(req, res, {}, cache)

    it('must set current http context and read it when useCurrentHttpContext', () => {
        const ctx = useCurrentHttpContext().getCtx()
        expect(ctx.req).toBe(req)
        expect(ctx.res).toBe(res)
    })

    it('must useCacheObject', () => {
        const data = useCacheObject('body')
        expect(data).toEqual('some data')
    })

    it('must clearCacheObject', () => {
        clearCacheObject('body')
        const data = useCacheObject('body')
        expect(data).toEqual({})
    })

    it('must clear http context and throw error when useCurrentHttpContext', () => {
        clearCurrentHttpContext()
        expect(() => useCurrentHttpContext()).toThrowError()
    })
})
