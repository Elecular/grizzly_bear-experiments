#!/bin/bash
curl --location --request POST 'https://api.github.com/repos/nj20/grizzly_bear-experiments/deployments' \
--header "Authorization: token $1" \
--data-raw '{
    "ref": "master",
    "payload": {
        "gke_cluster": "grizzly-bear-prod",
  	    "gke_zone": "us-central1-c"
    },
    "environment": "prod",
    "description": "Deploy master on production"
}'