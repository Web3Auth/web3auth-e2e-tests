#!/bin/bash

dirs=("./openlogin" "./wallets")

exitcode=0
TEST_RESULT_DIR="./test-results"

for dir in ${dirs[@]}; do
  for child_dir in "$dir"/*; do
    if [[ -d "$child_dir" ]]; then
      echo "Runnning tests"
      echo "$child_dir"
      npm run test:trace "test-results-${child_dir:2}" $child_dir
      code=$?
      echo $code
      if [[ "$code" -ne 0 ]]; then
        exitcode=$code
      fi
    fi
  done
done
if [[ $exitcode -ne 0 ]]; then
  echo "Test Failed, sending telegram alert"
  echo "******sending telegram alert*********"
  curl -X POST -H 'Content-Type: application/json' -d '{"chat_id": "${{$CHAT_ID}}", "text": "TestResult=Tests failed"}' https://api.telegram.org/bot$BOT_API_TOKEN/sendMessage
else
    echo "Test Passed, no alert!"
fi

if [ -d "$TEST_RESULT_DIR" ]; then
  # Take action if $DIR exists. #
  echo "*******listing content of test-results*********"
  echo "Listing content of ${TEST_RESULT_DIR}..."
  ls $TEST_RESULT_DIR
fi

# echo "*******updating status page*********"

# curl -X PATCH \
#   -H "Authorization: OAuth ${STATUS_PAGE_API_KEY}" \
#   -H "Content-Type: application/json" \
#   -d '{ "component": { "status": "'"${{ needs.run-tests.result == 'success' && 'operational' || 'major_outage' }}"'" } }' \
#   "https://api.statuspage.io/v1/pages"


exit $exitcode
