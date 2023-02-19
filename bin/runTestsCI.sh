#!/bin/bash

dirs=("./openlogin" "./wallet")

exitcode=0
for dir in ${dirs[@]}; do
  for child_dir in "$dir"/*; do
    if [[ -d "$child_dir" ]]; then
      echo "$child_dir"
      npm run test $child_dir
      code=$?
      echo $code
      if [[ "$code" -ne 0 ]]; then
        exitcode=$code
      fi
    fi
  done
done
if [[ $exitcode -ne 0 ]] then
    echo "Test Failed, sending telegram alert"
    curl -X POST -H 'Content-Type: application/json' -d '{"chat_id": "${{$CHAT_ID}}", "text": "TestResult=Tests failed"}' https://api.telegram.org/bot$BOT_API_TOKEN/sendMessage
else
    echo "Test Passed, no alert!"
fi

exit $exitcode
