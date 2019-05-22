// tslint:disable-next-line: no-submodule-imports
import ECR from 'aws-sdk/clients/ecr'

import { config } from './config'
import { IECRCredentials, K8s } from './K8s'

const k8s = K8s()
const ecr = new ECR()

const updateCycle = async (): Promise<void> => {
  // tslint:disable-next-line: no-console
  console.log(`Starting secrets update cycle`)

  try {
    const { authorizationData } = await ecr.getAuthorizationToken().promise()

    if (!authorizationData) {
      throw new Error('Could not get the ECR auth token')
    }

    const credentials = authorizationData
      .map(({ authorizationToken, proxyEndpoint: endpoint }) =>
        !authorizationToken
          ? null
          : (() => {
              const [username, password] = Buffer.from(
                authorizationData[0].authorizationToken || '',
                'base64'
              )
                .toString('utf-8')
                .split(':')
              return {
                endpoint,
                password,
                username,
              }
            })()
      )
      .filter<IECRCredentials>((x): x is IECRCredentials => !!x)

    credentials.forEach(({ endpoint }) => {
      // tslint:disable-next-line: no-console
      console.log(`Got authorization token for registry ${endpoint}`)
    })

    await k8s.refreshPullSecrets(
      config.K8S_PULL_SECRET_NAME,
      credentials,
      config.NAMESPACES
    )
  } catch (error) {
    // tslint:disable-next-line: no-console
    console.error(error)
  }

  await new Promise(resolve => {
    // tslint:disable-next-line: no-console
    console.log(
      `Awaiting ${Math.round(
        config.SECRET_UPDATE_INTERVAL / 1000
      )} seconds before next update cycle`
    )

    setTimeout(() => resolve(), config.SECRET_UPDATE_INTERVAL)
  })

  updateCycle().catch(() => null)
}

// tslint:disable-next-line: no-floating-promises
updateCycle()
