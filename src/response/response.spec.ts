import { BaseHttpResponse } from './core'
import { createResponseFrom } from './factory'
import { BaseHttpResponseRenderer } from './renderer'
import { setCurrentHttpContext } from '../composables/core'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

const baseRenderer = new BaseHttpResponseRenderer()
describe('response', () => {
    const req = new IncomingMessage(new Socket({}))
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })

    it('must create response from json', () => {
        const response = createResponseFrom({a: 'a', b: [1,2,3]}) as BaseHttpResponse<unknown>
        expect(baseRenderer.render(response)).toEqual('{"a":"a","b":[1,2,3]}')
    })

    it('must create response from text', () => {
        const response = createResponseFrom('hello world') as BaseHttpResponse<unknown>
        expect(baseRenderer.render(response)).toEqual('hello world')
    })

    it('must create response boolean', () => {
        const response = createResponseFrom(true) as BaseHttpResponse<unknown>
        expect(baseRenderer.render(response)).toEqual('true')
    })
})
