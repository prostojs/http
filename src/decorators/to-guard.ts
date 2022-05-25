import { useCurrentHttpContext } from '../composables/core'
import { ProstoHttpError } from '../errors'
import { createResponseFrom } from '../response'
import { TProstoHttpHandler } from '../types'

export type TGuardFunction = () => boolean | Promise<boolean>
export type TGuardDecoratedFunction = (handler: TProstoHttpHandler) => TProstoHttpHandler

export function toGuard(...guardFns: TGuardFunction[]): TGuardDecoratedFunction {
    const guardDecorator = (handler: TProstoHttpHandler) => {
        const newHandler = async () => {
            const { restoreCtx } = useCurrentHttpContext()
            try {
                for (const guardFn of guardFns) {
                    const authorized = await guardFn()
                    restoreCtx()
                    if (!authorized) {
                        return createResponseFrom(new ProstoHttpError(401))
                    }
                }
            } catch(e) {
                return createResponseFrom(e)
            }
            restoreCtx()
            return await handler()
        }
        return newHandler
    }
    return guardDecorator
}
