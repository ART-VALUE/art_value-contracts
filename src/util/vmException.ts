export function expectVmExceptionHasReason(vmException: any, reason: string) {
  expect(vmException).to.be.instanceOf(Error)
  expect(vmException).to.haveOwnProperty('data')
  const data = vmException.data
  for (const key of Object.keys(data)) {
    const value = data[key]
    if (value['reason'] === reason) return
  }
  expect.fail(`vmException.data doesn\'t have a property with the right reason ("${reason}")`)
}

export async function expectToThrowVmExceptionWithReason<T>(
  block: () => Promise<T>,
  reason: string
) {
  let called = false;
  block()
    .then(() => {
      if (called) return
      called = true
      expect.fail('Expected to throw')
    })
    .catch(vmException => {
      if (called) return
      called = true
      expect(vmException, 'Thrown exception to be an `Error`').to.be.instanceOf(Error)
      expect(vmException, 'Thrown exception to have `data` property').to.haveOwnProperty('data')
      const data = vmException.data
      for (const key of Object.keys(data)) {
        const value = data[key]
        if (value['reason'] === reason) return
      }
      expect.fail(`vmException.data doesn\'t have a property with the right reason ("${reason}")`)
    })
}
