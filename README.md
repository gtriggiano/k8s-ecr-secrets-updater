# K8s ECR secrets updater
A service to keep ECR pull secrets updated

### The problem

You have a k8s cluster whose nodes are not automatically allowed to pull images from your ECR registry.

You can then specify `imagePullSecrets` on a Pod spec, targeting a secret which contains a `.dockercongigjson` property to be used by `docker pull ...`, **but** you have to periodically refresh that secret because ECR access tokens last for a max of 12 hours.... meh...

Plus, you should have that secret in every namespace holding pods which need to use it, thus potentially multiplying the refreshing problem.

### The solution

You deploy this simple service, which periodically will refresh your secret(s) 🌷

**NOTE**: your secret(s) will be created if not existent or **replaced** if otherwise.

## Setup

1. **Create a IAM user and attach a policy to it like the following:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "ecr:GetLifecyclePolicyPreview",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:DescribeImages",
        "ecr:DescribeRepositories",
        "ecr:ListTagsForResource",
        "ecr:ListImages",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetLifecyclePolicy",
        "ecr:GetRepositoryPolicy",
        "ecr:GetAuthorizationToken"
      ],
      "Resource": "*"
    }
  ]
}
```

2. **Clone this repository and edit the files into `./manifests` to your liking.**

**The only file you have to edit is `./manifests/aws-credentials.yaml`**, providing the AWS credentials of the IAM user you created before.

You can then configure the values of the following ENV variables in `./manifests/deployment.yaml`:

| Variable               | Default value | Description                                                                                                                                                              |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| K8S_PULL_SECRET_NAME   | `ecr`         | The name of the pull secret that should be created/refreshed                                                                                                             |
| SECRET_UPDATE_INTERVAL | `3600`        | Every how many seconds the secret(s) should bu updated                                                                                                                   |
| NAMESPACES             | none          | If you omit this variable a secret is going to be created/refreshed in every namespace. Otherwise you can list the target namespaces'names, separating them with a comma |

3. **Apply the edited manifests to your K8s**
```bash
kubectl apply -f ./manifests
```