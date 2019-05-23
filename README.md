# K8s ECR secrets updater
A service to keep ECR pull secrets updated

### The problem

You have a k8s cluster whose nodes are not automatically allowed to pull images from your ECR registry.

You can then specify `imagePullSecrets` on a Pod spec, targeting a secret which contains a `.dockercongigjson` property to be used by `docker pull ...`, **but** you have to periodically refresh that secret because ECR access tokens last for a max of 12 hours.... meh...

Plus, you should have that secret in every namespace holding pods which need to use it, thus potentially multiplying the refreshing problem.

### The solution

You deploy this simple service, which periodically will refresh your secret(s) 🌷