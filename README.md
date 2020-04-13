# Experiments Service

![Test](https://github.com/nj20/grizzly_bear-experiments/workflows/test/badge.svg?branch=master) ![Deploy To GKE](https://github.com/nj20/grizzly_bear-experiments/workflows/Deploy%20To%20GKE/badge.svg?branch=master)

### Introduction

This service is used for creating experiments.


### Workflows

This section will describe how to develop, test and push the application to staging and production

---

#### Development

You can run the following command to start the service and start making changes. The service will automatically pickup any changes!
```
npm run start:dev
```

---

#### Testing

This command runs unit, integration and acceptance tests
```
npm test
```

This command runs unit and integration tests
```
npm test:jest
```

This command runs acceptance tests
```
npm test:acceptance
```

---

#### Deploying On Stage/Prod

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

---

#### Deploying On Any K8s Cluster

This is how you deploy this service using [kustomize](https://kustomize.io/) and [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
```
cd kubernetes/overlays/stage
curl -o kustomize --location https://github.com/kubernetes-sigs/kustomize/releases/download/v3.1.0/kustomize_3.1.0_linux_amd64
chmod u+x ./kustomize
./kustomize edit set image XXXX=<image>
./kustomize build . | kubectl apply -f -
```

These are the secrets that need to be setup

```
experiments-db-secret:
  MONGODB_URL: <mongodb_url>
  MONGODB_DATABASE: <database name>
```


Example of setting up a k8s secret

```
kubectl create secret generic experiments-db-secret --from-literal=MONGODB_URL=<mongodb_url>--from-literal=MONGODB_DATABASE=<mongodb_database>
```

---

#### Starting Service With Mock Data

You can start the service and with some mock data using the following command. Note, you will need to setup MongoDB either in your local machine or a docker-compose file. 

```
npm start -- \
--randomData \
--data '[{
        "projectId": "5e865ed82a2aeb6436f498dc",
        "experimentName": "exp1",
        "startTime": "79839129600000",
        "endTime": "79839129600005"
    }]'
```