#!/bin/bash
MAX_WAIT=${MAX_WAIT:-5}
ROUTER_NAME=${ROUTER_NAME:-hsl}
docker run -d --name otp-data hsldevcom/opentripplanner-data-container

docker run -d --name otp -p 10000:8080 -e ROUTER_NAME=$ROUTER_NAME -e ROUTER_DATA_CONTAINER_URL=http://otp-data/ --link otp-data:otp-data hsldevcom/opentripplanner:prod

ITERATIONS=$(($MAX_WAIT * 6))
echo "max wait (minutes): $MAX_WAIT"

for (( c=1; c<=$ITERATIONS; c++ ));do
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:10000/otp/routers/default)

  if [ $STATUS_CODE = 200 ]; then
    echo "OTP started"
    curl -s "http://127.0.0.1:10000/otp/routers/default/plan?fromPlace=60.17078422953281%2C24.941625595092773&toPlace=60.21918441389899%2C24.811420440673828&time=2%3A03pm&date=02-20-2017&mode=TRANSIT%2CWALK&maxWalkDistance=804.672&arriveBy=false&wheelchair=false&locale=en"|grep error
    if [ $? = 1 ]; then #grep finds no error
	echo "OK"
	docker stop otp-data
        docker stop otp
	docker rm otp-data
	docker rm otp
	exit 0;
    else
	echo "ERROR"
	docker stop otp-data
        docker stop otp
	docker rm otp-data
	docker rm otp
	exit 1;
    fi
  else
    echo "waiting for service"
    sleep 10
  fi
done
docker stop otp-data
docker stop otp
docker rm otp-data
docker rm otp

exit 1;

