import { cleanEnv, makeValidator, str } from 'envalid'

const namespaces = makeValidator<string[]>(s =>
  // tslint:disable-next-line: strict-type-predicates
  typeof s === 'string' ? s.split(',').map(x => x.trim()) : []
)

const seconds = makeValidator<number>(s => {
  if (/^[0-9]+$/.test(s)) {
    return parseInt(s, 10) * 1000
  } else {
    throw new Error('Expected an integer')
  }
}, 'seconds')

export const config = cleanEnv(process.env, {
  K8S_PULL_SECRET_NAME: str({ default: 'ecr' }),
  NAMESPACES: namespaces({ default: [] }),
  SECRET_UPDATE_INTERVAL: seconds({ default: 3600 }),
})
