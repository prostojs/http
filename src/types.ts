import { BaseHttpResponse } from './response'

export interface TProstoServerOptions {

}

export type TProstoHttpHandler<ResType = unknown> = () 
    => Promise<ResType> | ResType | Error | Promise<Error> | BaseHttpResponse<ResType> | Promise<BaseHttpResponse<ResType>>
