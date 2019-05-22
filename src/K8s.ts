import { Core_v1Api, KubeConfig, V1Secret } from '@kubernetes/client-node'

export interface IECRCredentials {
  endpoint: string
  password: string
  username: string
}

export const K8s = () => {
  const client = new KubeConfig()
  client.loadFromCluster()

  const api = client.makeApiClient(Core_v1Api)

  const getActualNamespaces = () =>
    api.listNamespace().then(({ body: { items } }) => items)
  const getAllSecrets = () =>
    api.listSecretForAllNamespaces().then(({ body: { items } }) => items)

  return {
    refreshPullSecrets: async (
      secretName: string,
      credentialsList: IECRCredentials[],
      namespacesToPopulate: string[]
    ): Promise<void> => {
      const dockerconfigjson = JSON.stringify({
        auths: credentialsList.reduce(
          (dict, { endpoint, password, username }) => ({
            ...dict,
            [endpoint.replace('https://', '')]: { password, username },
          }),
          Object.create(null)
        ),
      })

      const secret = ({
        apiVersion: 'v1',
        data: {
          '.dockerconfigjson': Buffer.from(dockerconfigjson, 'utf-8').toString(
            'base64'
          ),
        },
        kind: 'Secret',
        metadata: {
          name: secretName,
        },
        type: 'kubernetes.io/dockerconfigjson',
      } as unknown) as V1Secret

      const actualNamespaces = await getActualNamespaces()
      const namespaces =
        namespacesToPopulate.length === 0
          ? actualNamespaces
          : actualNamespaces.filter(namespace =>
              namespacesToPopulate.includes(namespace.metadata.name)
            )

      const actualSecrets = await getAllSecrets().then(secrets =>
        secrets.filter(({ metadata: { name } }) => name === secretName)
      )

      await Promise.all(
        namespaces.map(async ({ metadata: { name: namespaceName } }) => {
          const METHOD = actualSecrets.find(
            ({ metadata: { namespace } }) => namespace === namespaceName
          )
            ? 'REPLACE'
            : 'CREATE'

          switch (METHOD) {
            case 'CREATE':
              await api.createNamespacedSecret(namespaceName, secret)
              // tslint:disable-next-line: no-console
              console.log(
                `Created secret "${secretName}" inside namespace "${namespaceName}"`
              )
              break
            case 'REPLACE':
              await api.replaceNamespacedSecret(
                secretName,
                namespaceName,
                secret
              )
              // tslint:disable-next-line: no-console
              console.log(
                `Updated secret "${secretName}" inside namespace "${namespaceName}"`
              )
          }
        })
      )
    },
  }
}
