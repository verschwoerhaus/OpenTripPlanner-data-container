#!/bin/bash

# Set these environment variables
#ROUTER_NAME // hsl/waltti/finland
#DOCKER_USER // dockerhub credentials
#DOCKER_AUTH
#DOCKER_TAG or TRAVIS_COMMIT
set -e

echo "*** Building for" $ROUTER_NAME

ORG=${ORG:-hsldevcom}
CONTAINER=opentripplanner-data-container
DOCKER_TAG=${DOCKER_TAG:-$TRAVIS_COMMIT}
DOCKER_IMAGE=$ORG/$CONTAINER-$ROUTER_NAME
DOCKER_BUILDER_IMAGE=$DOCKER_IMAGE:builder
DOCKER_LATEST_IMAGE=$DOCKER_IMAGE:latest
DOCKER_PROD_IMAGE=$DOCKER_IMAGE:prod
export DOCKER_TAGGED_IMAGE=$DOCKER_IMAGE:$DOCKER_TAG

curl http://dev.hsl.fi/osm.finland/finland.osm.pbf -o finland.osm.pbf &
curl http://dev.hsl.fi/osm.hsl/hsl.osm.pbf -o hsl.osm.pbf &
wait

# Build data with builder
echo "*** Creating builder image"
rm -rf target build
docker build --build-arg ROUTER_NAME="$ROUTER_NAME" --tag=$DOCKER_BUILDER_IMAGE -f Dockerfile.builder .
mkdir target
docker run --rm --entrypoint tar $DOCKER_BUILDER_IMAGE -c /opt/$CONTAINER/webroot|tar x -C target
echo "*** Builder image created and launched"

#prebuild graph
echo "*** Prebuilding the graph"
mkdir -p build/$ROUTER_NAME
unzip -j target/opt/$CONTAINER/webroot/router-$ROUTER_NAME.zip -d build/$ROUTER_NAME/
VERSION=`docker run --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -jar otp-shaded.jar --version"|grep commit|cut -d' ' -f2`
docker run -v `pwd`/build:/opt/opentripplanner/graphs --rm --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -Xmx6g -jar otp-shaded.jar --build graphs/$ROUTER_NAME"
cd build/
zip graph-$ROUTER_NAME-$VERSION.zip $ROUTER_NAME/router-config.json $ROUTER_NAME/Graph.obj
cd ..

#build docker image
echo "*** Building the actual docker image"
docker build --tag=$DOCKER_TAGGED_IMAGE -f Dockerfile .
docker login -u $DOCKER_USER -p $DOCKER_AUTH
docker push $DOCKER_TAGGED_IMAGE

#test new image

if [ "$ROUTER_NAME" == "hsl" ]; then
    echo "*** Testing hsl"
    export MAX_WAIT=10
    export URL="http://127.0.0.1:10000/otp/routers/default/plan?fromPlace=60.19812876015124%2C24.934051036834713&toPlace=60.218630210423306%2C24.807472229003906"
elif [ "$ROUTER_NAME" == "waltti" ]; then
    echo "*** Testing waltti"
    export MAX_WAIT=15
    export URL="http://127.0.0.1:10000/otp/routers/default/plan?fromPlace=60.44638185995603%2C22.244396209716797&toPlace=60.45053041945487%2C22.313575744628906"
else
    echo "*** Testing finland"
    export MAX_WAIT=25
    export URL="http://127.0.0.1:10000/otp/routers/default/plan?fromPlace=60.19812876015124%2C24.934051036834713&toPlace=60.218630210423306%2C24.807472229003906"
fi

./test.sh

echo "*** $ROUTER_NAME tests passed! Tagging and pushing the created image."

#if ok, tag and push to dev and production
docker tag $DOCKER_TAGGED_IMAGE $DOCKER_LATEST_IMAGE
docker push $DOCKER_LATEST_IMAGE

#enable when new there's good confidence in the new build
#docker tag -f $DOCKER_TAGGED_IMAGE $DOCKER_PROD_IMAGE
#docker push $DOCKER_PROD_IMAGE

echo "*** $ROUTER_NAME build finished succesfully"
