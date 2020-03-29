# Experiments Service

![Test](https://github.com/nj20/grizzly_bear-experiments/workflows/test/badge.svg?branch=master) ![Deploy To GKE](https://github.com/nj20/grizzly_bear-experiments/workflows/Deploy%20To%20GKE/badge.svg?branch=master)

### Introduction

This service is used for creating experiments.


### Workflows

This section will describe how to develop, test and push the application to staging and production

##### Development

You can run the following command to start the service and start making changes. The service will automatically pickup any changes!
```
npm run start:dev
```

##### Testing

```
npm test
```

##### Pull Request

Once you make your changes, make a pull request and github action will automatically run tests on your branch. Once the pull request gets approval, you can merge the branch with master

##### Deploying On Stage/Prod

Once the branch is merged, you can run the following commands to deploy the applocation on stage and then on prod.

```
./app/bin/deploy-stage.sh <github-auth-token>
```
```
./app/bin/deploy-prod.sh <github-auth-token>
```
If the github-auth-token is invalid, the command will return the following response:
```
{
  "message": "Bad credentials",
  "documentation_url": "https://developer.github.com/v3"
}
```

##### Deploy On Any K8s Cluster

```
cd kubernetes/overlays/stage
curl -o kustomize --location https://github.com/kubernetes-sigs/kustomize/releases/download/v3.1.0/kustomize_3.1.0_linux_amd64
chmod u+x ./kustomize
./kustomize edit set image XXXX=<image>
./kustomize build . | kubectl apply -f -
```

###### Secrets To Configure

```
experiments-db-secret:
  MONGODB_URL: <mongodb_url>
  MONGODB_DATABASE: <database name>
```