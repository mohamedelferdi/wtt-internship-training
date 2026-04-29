export function timeDecorator(this: any, someOtherDecoratorArgs = false) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      const actions = async () => {
        // pre action
        console.log(`[START] ${propertyKey}`)
        const start = performance.now()

        // action
        const ret = await originalMethod.apply(this, args)

        // post action
        const time = Math.round((performance.now() - start) / 100) / 10
        console.log(`[⌛ ${time}s] ${propertyKey}`)
        return ret
      }
      return actions.apply(this)
    }
    return descriptor
  }
}
