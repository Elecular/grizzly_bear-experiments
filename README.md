# Experiments Service

![Test](https://github.com/nj20/grizzly_bear-experiments/workflows/test/badge.svg?branch=master) ![Deploy To GKE](https://github.com/nj20/grizzly_bear-experiments/workflows/Deploy%20To%20GKE/badge.svg?branch=master)

---

### How To Develop

You can run the following command to start the service in development mode. The service will automatically pickup any changes!

```
npm run start:dev
```

---

### Testing

For **all** tests

```
npm test
```

For **unit** and **integration** tests

```
npm test:jest
```

For **acceptance** tests

```
npm test:acceptance
```

---

### Deloying Docker Image

The Dockerfile is located at the root folder. This can be used to deploy a container for this service. In order for the container to work properly, you must pass in the following environment variables:

1. MONGODB_URL : URL of the mongodb database
2. MONGODB_DATABASE : A Database name.

Here is an example docker-compose file that is deploying this docker image on port 80:

```
version: "3"
services:
    web:
        depends_on:
            - db
        image: experiments
        ports:
            - "80:3000"
        volumes:
            - ./:/code/
            - /code/node_modules
        links:
            - "db:database"
        environment:
            MONGODB_URL: mongodb://username:password@database:27017
            MONGODB_DATABASE: experiments
    db:
        image: mongo
        environment:
            MONGO_INITDB_ROOT_USERNAME: username
            MONGO_INITDB_ROOT_PASSWORD: password
```

To deploy the image with some mock data, you must start the service with the following command. Normally, the service just starts with npm start, but in this case, we are passing some additional command line arguments inorder to add mock data.

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

---

### Deploying Locally On K8s

We can deploy this service locally on k8s. You must have first installed the following software

1: [kustomize](https://kustomize.io/): Used for making k8s template files

```
kustomize version
```

2: Local K8s Cluster: You can install this through [Minikube](https://kubernetes.io/docs/setup/learning-environment/minikube/) or [Docker Desktop](https://www.docker.com/products/docker-desktop).

3: [Docker](https://www.docker.com/)

Once you have installed these software you must

1. Create a MongoDB service (Either in the your local k8s cluster or anywhere else you like)
2. Configure the following secret in your local k8s cluster

```
experiments-db-secret:
  MONGODB_URL: <mongodb_url>
  MONGODB_DATABASE: <database name>
```

3. Run the following command

```
./app/bin/deploy-local.sh
```

---

### Deploying On Stage/Prod

You can run the following commands to deploy the applocation on stage and then on prod. The project is deployed Google Kubernetes Engine using github workflows. All of the scripts can be found in .github folder.

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

### Deploying On Any K8s Cluster

This is how you deploy this service using [kustomize](https://kustomize.io/) and [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

```
cd kubernetes/overlays/stage
./kustomize edit set image XXXX=<image>
./kustomize build . | kubectl apply -f -
```

Before deploying on the cluster, you must setup the following secret

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
