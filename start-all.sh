set -e

npm run start:strategy &  
PID_STRATEGY=$!

npm run start:indexer  
PID_INDEXER=$!

wait $PID_STRATEGY $PID_INDEXER