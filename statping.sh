#!/usr/bin/env bash

# ENV Validations
if [[ ! -v STATPING_INSTANCE ]]; then
    echo "STATPING_INSTANCE is not set"
elif [[ -z "$STATPING_INSTANCE" ]]; then
    echo "STATPING_INSTANCE is set to the empty string"
else
    echo "STATPING_INSTANCE has the value: $STATPING_INSTANCE"
fi

if [[ ! -v STATPING_API_SECRET ]]; then
    echo "STATPING_API_SECRET is not set"
elif [[ -z "$STATPING_API_SECRET" ]]; then
    echo "STATPING_API_SECRET is set to the empty string"
fi

# TESTS: an Array pretending to be a Pythonic dictionary
# Key is the test to run
# Value is the service_id on statping
TESTS=( "homepage:38"
        "google:39"
        "passwordless:40"
        "facebook:41"
        "discord:42" )

for value in "${TESTS[@]}" ; do
    TEST="${value%%:*}"
    SERVICE_ID="${value##*:}"
    printf "TEST: %s, SERVICE_ID: %s.\n" "$TEST" "$SERVICE_ID"

    STARTTIME=$(date +%s)
    RESULT=$(npx playwright test --retries=3 $TEST)
    ENDTIME=$(date +%s)
    LATENCY=$((($ENDTIME - $STARTTIME) * 1000000))
    echo "${RESULT}"
    if [[ "$RESULT" =~ .*"failed".* ]]; then
        echo FAIL
        printf -v data '{"online": false, "LATENCY":%d, "issue":"Test Failed"}' ${LATENCY}
        curl -X PATCH -H "Authorization: Bearer $STATPING_API_SECRET" -H "Content-Type: application/json" -d "${data}"  "$STATPING_INSTANCE/api/services/$SERVICE_ID"
    else
        echo OK
        printf -v data '{"online": true, "LATENCY":%d, "issue":"NA"}' "${LATENCY}"
        curl -X PATCH -H "Authorization: Bearer $STATPING_API_SECRET" -H "Content-Type: application/json" -d "${data}"  "$STATPING_INSTANCE/api/services/$SERVICE_ID"
    fi
done
