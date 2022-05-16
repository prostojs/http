import { setCurrentHttpContext } from '../core'
import { useBody } from '../body'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

describe('composables/body', () => {
    const req = new IncomingMessage(new Socket({}))
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })

    it('must parse body content-type application/json', () => {
        req.headers['content-type'] = 'application/json'
        const { isJson, isHtml, isXml, isText, isBinary, isFormData, isUrlencoded } = useBody()
        expect(isJson()).toBe(true)
        expect(isXml()).toBe(false)
        expect(isHtml()).toBe(false)
        expect(isText()).toBe(false)
        expect(isBinary()).toBe(false)
        expect(isFormData()).toBe(false)
        expect(isUrlencoded()).toBe(false)
    })

    it('must parse body content-type text/xml', () => {
        req.headers['content-type'] = 'text/xml'
        const { isJson, isHtml, isXml, isText, isBinary, isFormData, isUrlencoded } = useBody()
        expect(isJson()).toBe(false)
        expect(isXml()).toBe(true)
        expect(isHtml()).toBe(false)
        expect(isText()).toBe(false)
        expect(isBinary()).toBe(false)
        expect(isFormData()).toBe(false)
        expect(isUrlencoded()).toBe(false)
    })

    it('must parse body content-type text/html', () => {
        req.headers['content-type'] = 'text/html'
        const { isJson, isHtml, isXml, isText, isBinary, isFormData, isUrlencoded } = useBody()
        expect(isJson()).toBe(false)
        expect(isXml()).toBe(false)
        expect(isHtml()).toBe(true)
        expect(isText()).toBe(false)
        expect(isBinary()).toBe(false)
        expect(isFormData()).toBe(false)
        expect(isUrlencoded()).toBe(false)
    })

    it('must parse body content-type text/plain', () => {
        req.headers['content-type'] = 'text/plain'
        const { isJson, isHtml, isXml, isText, isBinary, isFormData, isUrlencoded } = useBody()
        expect(isJson()).toBe(false)
        expect(isXml()).toBe(false)
        expect(isHtml()).toBe(false)
        expect(isText()).toBe(true)
        expect(isBinary()).toBe(false)
        expect(isFormData()).toBe(false)
        expect(isUrlencoded()).toBe(false)
    })

    it('must parse body content-type application/octet-stream', () => {
        req.headers['content-type'] = 'application/octet-stream'
        const { isJson, isHtml, isXml, isText, isBinary, isFormData, isUrlencoded } = useBody()
        expect(isJson()).toBe(false)
        expect(isXml()).toBe(false)
        expect(isHtml()).toBe(false)
        expect(isText()).toBe(false)
        expect(isBinary()).toBe(true)
        expect(isFormData()).toBe(false)
        expect(isUrlencoded()).toBe(false)
    })

    it('must parse body content-type multipart/form-data', () => {
        req.headers['content-type'] = 'multipart/form-data'
        const { isJson, isHtml, isXml, isText, isBinary, isFormData, isUrlencoded } = useBody()
        expect(isJson()).toBe(false)
        expect(isXml()).toBe(false)
        expect(isHtml()).toBe(false)
        expect(isText()).toBe(false)
        expect(isBinary()).toBe(false)
        expect(isFormData()).toBe(true)
        expect(isUrlencoded()).toBe(false)
    })

    it('must parse body content-type application/x-www-form-urlencoded', () => {
        req.headers['content-type'] = 'application/x-www-form-urlencoded'
        const { isJson, isHtml, isXml, isText, isBinary, isFormData, isUrlencoded } = useBody()
        expect(isJson()).toBe(false)
        expect(isXml()).toBe(false)
        expect(isHtml()).toBe(false)
        expect(isText()).toBe(false)
        expect(isBinary()).toBe(false)
        expect(isFormData()).toBe(false)
        expect(isUrlencoded()).toBe(true)
    })

    it('must parse content encodings', () => {
        req.headers['content-encoding'] = 'identity'
        const { contentEncodings } = useBody()
        expect(contentEncodings()).toEqual(['identity'])
    })

    it('must parse body json', async () => {
        const bodyValue = JSON.stringify({ test: 'object', a: 123 })
        setCurrentHttpContext(req, res, {}, { __body: { value: bodyValue } })
        req.headers['content-type'] = 'application/json'
        const { parseBody } = useBody()
        expect(await parseBody()).toEqual({ test: 'object', a: 123 })
    })  

    it('must parse body form-data', async () => {
        const bodyValue = `----------------------------038816476509113988597354
Content-Disposition: form-data; name="x2[]"

22
----------------------------038816476509113988597354
Content-Disposition: form-data; name="x3"

33
----------------------------038816476509113988597354
Content-Disposition: form-data; name="x2[]"

44%25
----------------------------038816476509113988597354--
`
        setCurrentHttpContext(req, res, {}, { __body: { value: bodyValue } })
        req.headers['content-type'] = 'multipart/form-data; boundary=--------------------------038816476509113988597354'
        const { parseBody } = useBody()
        expect(await parseBody()).toEqual({
            'x2[]': '22\n44%25',
            x3: '33',
        })
    })    

    it('must parse body form-data with json', async () => {
        const bodyValue = `----------------------------038816476509113988597354
Content-Disposition: form-data; name="x3"

33
----------------------------038816476509113988597354
Content-Type: application/json
Content-Disposition: form-data; name="x4"

{ "a": "b" }
----------------------------038816476509113988597354--
`
        setCurrentHttpContext(req, res, {}, { __body: { value: bodyValue } })
        req.headers['content-type'] = 'multipart/form-data; boundary=--------------------------038816476509113988597354'
        const { parseBody } = useBody()
        expect(await parseBody()).toEqual({
            x3: '33',
            x4: { a: 'b' },
        })
    })    

    it('must parse body x-www-form-urlencoded', async () => {
        const bodyValue = 't1=11&t2=2'
        setCurrentHttpContext(req, res, {}, { __body: { value: bodyValue } })
        req.headers['content-type'] = 'application/x-www-form-urlencoded'
        const { parseBody } = useBody()
        expect(await parseBody()).toEqual({
            t1: '11',
            t2: '2',
        })
    })    
})
