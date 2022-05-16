import { HttpErrorRenderer } from './error-renderer'
import { ProstoHttpError, TProstoHttpErrorBodyExt } from './http-error'
import { setCurrentHttpContext } from '../composables/core'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import { BaseHttpResponse, createResponseFrom } from '../response'

const renderer = new HttpErrorRenderer()
describe('response', () => {
    const req = new IncomingMessage(new Socket({}))
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })

    it('must create error-response in json', () => {
        req.headers.accept = 'application/json'
        expect(renderer.render(createResponseFrom(new ProstoHttpError(405, 'test message')) as BaseHttpResponse<TProstoHttpErrorBodyExt>))
            .toEqual('{"statusCode":405,"error":"Method Not Allowed","message":"test message"}')
    })

    it('must create error-response in text', () => {
        req.headers.accept = 'text/plain'
        expect(renderer.render(createResponseFrom(new ProstoHttpError(405, 'test message')) as BaseHttpResponse<TProstoHttpErrorBodyExt>))
            .toEqual('405 Method Not Allowed\ntest message')
    })

    it('must create error-response in html', () => {
        req.headers.accept = 'text/html'
        expect(renderer.render(createResponseFrom(new ProstoHttpError(405, 'test message')) as BaseHttpResponse<TProstoHttpErrorBodyExt>))
            .toEqual('<html style="background-color: #333; color: #bbb;"><head><title>405 Method Not Allowed</title>' +
            '</head><body><center><h1>405 Method Not Allowed</h1></center><center><h4>test message</h1></center>' +
            '<hr color="#666"><center style="color: #666;"> @prostojs/http vJEST_TEST </center></body></html>')
    })
})
