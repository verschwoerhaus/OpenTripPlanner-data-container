#!/bin/bash

#build errors should not stop the continuous build loop
set +e

#How long the build can last before it is considered frozen (default 3 hours)
MAX_TIME=${MAX_TIME:-10800}
#how often data is built (default once a day)
BUILD_INTERVAL=${BUILD_INTERVAL:-1}
#Substract one day, because first wait hours are computed before each build
BUILD_INTERVAL_SECONDS=$((($BUILD_INTERVAL - 1)*24*3600))
#start build at this time (GMT):
BUILD_TIME=${BUILD_TIME:-23:00:00}

# run data build loop forever, unless build interval is set to zero
while true; do
    if [[ "$BUILD_INTERVAL" -gt 0 ]]; then
        SLEEP=$(($(date -u -d $BUILD_TIME +%s) - $(date -u +%s) + 1))
        if [[ "$SLEEP" -le 0 ]]; then
            #today's build time is gone, start counting from tomorrow
            SLEEP=$(($SLEEP + 24*3600))
        fi
        SLEEP=$(($SLEEP + $BUILD_INTERVAL_SECONDS))

        echo "** Sleeping $SLEEP seconds until the next build"
        sleep $SLEEP
    fi

    echo "** Launching OTP data builder"

    #note: busybox timeout
    timeout -t $MAX_TIME node index.js once
    SUCCESS=$?

    if [ $SUCCESS = 143 ]; then
        echo "** ERROR: Build frozen"
        if [ -v SLACK_WEBHOOK_URL ]; then
            curl -X POST -H 'Content-type: application/json' \
                 --data '{"text":"ERROR: data builder frozen, restarting."}' $SLACK_WEBHOOK_URL
        fi
    else
        if [ $SUCCESS -ne 0 ]; then
            echo "** ERROR: Build failed"
        fi
    fi

    if [ $SUCCESS -ne 0 ]; then
        # try once more
        echo "** Restarting builder once"
        timeout -t $MAX_TIME  node index.js once
        SUCCESS=$?

        if [ $SUCCESS = 143 ]; then
            echo "** ERROR: Second build frozen. Trying again tomorrow."
            if [ -v SLACK_WEBHOOK_URL ]; then
                curl -X POST -H 'Content-type: application/json' \
                 --data '{"text":"Second build frozen. Trying again tomorrow."}' $SLACK_WEBHOOK_URL
            fi
        else
            if [ $SUCCESS -ne 0 ]; then
                echo "** ERROR: Second build failed"
            fi
        fi
    fi

    echo "** OTP data build cycle done"

    if [[ "$BUILD_INTERVAL" -le 0 ]]; then
        #run only once
        exit 0
    fi
done
