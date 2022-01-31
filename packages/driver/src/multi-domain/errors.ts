import type { $Cy } from '../cypress/cy'
import $errUtils, { ErrorFromProjectRejectionEvent } from '../cypress/error_utils'

export const handleErrorEvent = (cy: $Cy) => {
  return (handlerType: string, frameType?: string) => {
    return (event) => {
      const { originalErr, err, promise } = $errUtils.errorFromUncaughtEvent(handlerType, event) as ErrorFromProjectRejectionEvent
      const handled = cy.onUncaughtException({
        err,
        promise,
        handlerType,
        frameType: frameType ?? 'app',
      })

      $errUtils.logError(Cypress, handlerType, originalErr, handled)

      if (!handled) {
        // if unhandled, fail the current command to fail the current test in the primary domain
        // a current command may not exist if an error occurs in the spec bridge after the test is over
        const command = cy.state('current')
        const log = command?.getLastLog()

        if (log) log.error(err)
      }

      // return undefined so the browser does its default
      // uncaught exception behavior (logging to console)
      return undefined
    }
  }
}
