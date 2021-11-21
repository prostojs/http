import { TProstoHttpErrorBodyExt } from '.'
import { useAccept } from '../composables'
import { contentTypes } from '../content-types'
import { BaseHttpResponse, BaseHttpResponseRenderer } from '../response'
import { httpStatusCodes } from '../status-codes'

export class HttpErrorRenderer extends BaseHttpResponseRenderer<TProstoHttpErrorBodyExt> {
    renderHtml(response: BaseHttpResponse<TProstoHttpErrorBodyExt>): string {
        const data = response.body || {} as TProstoHttpErrorBodyExt
        response.setContentType(contentTypes.text.html)
        return '<html style="background-color: #333; color: #bbb;">' +
            `<head><title>${ data.statusCode } ${ httpStatusCodes[data.statusCode] }</title></head>` +
            `<body><center><h1>${ data.statusCode } ${ httpStatusCodes[data.statusCode] }</h1></center>` + 
            `<center><h4>${ data.message }</h1></center><hr color="#666">` +
            `<center style="color: #666;"> @prostojs/http v${ __VERSION__ } </center>` +
            '</body></html>'
    }

    renderText(response: BaseHttpResponse<TProstoHttpErrorBodyExt>): string {
        const data = response.body || {} as TProstoHttpErrorBodyExt
        response.setContentType(contentTypes.text.plain)
        return `${ data.statusCode } ${ httpStatusCodes[data.statusCode] }\n${ data.message }`
    }

    renderJson(response: BaseHttpResponse<TProstoHttpErrorBodyExt>): string {
        const data = response.body || {} as TProstoHttpErrorBodyExt
        response.setContentType(contentTypes.application.json)
        return `{"statusCode":${ data.statusCode },"error":"${ data.error }","message":"${ data.message }"}`
    }

    render(response: BaseHttpResponse<TProstoHttpErrorBodyExt>): string {
        const { acceptsJson, acceptsText, acceptsHtml } = useAccept()
        response.status = response.body?.statusCode || 500
        if (acceptsJson()) {
            return this.renderJson(response)
        } else if (acceptsHtml()) {
            return this.renderHtml(response)
        } else if (acceptsText()) {
            return this.renderText(response)
        } else {
            return this.renderJson(response)
        }
    }
}
