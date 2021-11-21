import { HttpErrorRenderer } from '.'
import { EHttpStatusCode, httpStatusCodes, THttpErrorCodes } from '../status-codes'

export class ProstoHttpError<T extends TProstoHttpErrorBody = TProstoHttpErrorBody> extends Error {
    constructor(protected code: THttpErrorCodes = 500, protected _body: string | T = '') {
        super(typeof _body === 'string' ? _body : _body.message)
    }

    get body(): TProstoHttpErrorBodyExt {
        return typeof this._body === 'string' ? {
            statusCode: this.code,
            message: this.message,
            error: httpStatusCodes[this.code],
        } : {
            ...this._body,
            statusCode: this.code,
            message: this.message,
            error: httpStatusCodes[this.code],
        }
    }

    protected renderer?: HttpErrorRenderer

    attachRenderer(renderer: HttpErrorRenderer) {
        this.renderer = renderer
    }

    getRenderer() {
        return this.renderer
    }
}

export interface TProstoHttpErrorBody {
    message: string
    statusCode: EHttpStatusCode
    error?: string
}

export interface TProstoHttpErrorBodyExt extends TProstoHttpErrorBody {
    error: string
}
