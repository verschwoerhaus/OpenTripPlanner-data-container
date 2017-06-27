#!/bin/bash
set +e

# This is run at ci, created an image that contains all the tools needed in
# databuild
#
# Set these environment variables
#DOCKER_USER // dockerhub credentials
#DOCKER_AUTH



ORG=${ORG:-hsldevcom}
DOCKER_TAG=${TRAVIS_BUILD_ID:-latest}
DOCKER_IMAGE=$ORG/otp-data-tools:${DOCKER_TAG}

echo Building image: $DOCKER_IMAGE

docker build  --tag=$DOCKER_IMAGE -f Dockerfile.otp-data-tools .
#docker login -u $DOCKER_USER -p $DOCKER_AUTH
#docker push $DOCKER_IMAGE

echo Build completed
