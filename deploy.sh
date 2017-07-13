#!/bin/bash
#builds tests and deploys data container from prepared data


# Set these environment variables
#DOCKER_USER // dockerhub credentials
#DOCKER_AUTH
set -e

ROUTER_NAME=${1:-hsl}
DATE=`date +"%Y-%m-%d"`

ORG=${ORG:-hsldevcom}
CONTAINER=opentripplanner-data-container
DOCKER_IMAGE=$ORG/$CONTAINER-$ROUTER_NAME
DOCKER_TEST_IMAGE=$DOCKER_IMAGE:test
DOCKER_DATE_IMAGE=$DOCKER_IMAGE:$DATE
DOCKER_LATEST_IMAGE=$DOCKER_IMAGE:latest
DOCKER_PROD_IMAGE=$DOCKER_IMAGE:prod


echo "*** Testing $ROUTER_NAME..."

./test.sh $ROUTER_NAME

echo "*** $ROUTER_NAME tests passed"

docker login -u $DOCKER_USER -p $DOCKER_AUTH
docker tag $DOCKER_TEST_IMAGE $DOCKER_DATE_IMAGE
echo "*** Pushing $DOCKER_DATE_IMAGE"
docker push $DOCKER_DATE_IMAGE
docker tag $DOCKER_TEST_IMAGE $DOCKER_LATEST_IMAGE
echo "*** Pushing $DOCKER_LATEST_IMAGE"
docker push $DOCKER_LATEST_IMAGE
docker tag $DOCKER_TEST_IMAGE $DOCKER_PROD_IMAGE
echo "*** Pushing $DOCKER_PROD_IMAGE"
docker push $DOCKER_PROD_IMAGE
echo "*** Deployed $ROUTER_NAME"
