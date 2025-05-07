#!/bin/bash

# Array of desired hash amounts to test
hash_amounts=(1 10 25 50 100 200 300 400 600 1000 5000 10000)

# Function to run test and capture output
function run_test_and_capture() {
    local hash_amount=$1

    echo "Running test for hash amount: ${hash_amount}"
    
    # Update the TypeScript file with the new hash amount
    sed -i "s/const chainSize: number = [0-9_]\+;/const chainSize: number = ${hash_amount};/" test/utils/deployEthWord.ts

    # Run the Hardhat test
    npx hardhat test test/ethword/CloseChannel.test.ts

    # Check if out.json is created successfully
    if [ -f "./out.json" ]; then
        mkdir -p ./output
        mv out.json "./output/out_${hash_amount}.json"

        # Extract gas amount using jq and save to a data file
        local gas_amount=$(jq -r '.data.methods[] | select(.method == "closeChannel") | .executionGasAverage' "./output/out_${hash_amount}.json")
        echo "${hash_amount},${gas_amount}" >> gas_data.csv
    else
        echo "Test did not generate out.json for hash amount ${hash_amount}."
    fi
}

# Initialize data file
echo "hash_amount,gas_usage" > gas_data.csv

# Loop through all hash amounts and run tests
for amount in "${hash_amounts[@]}"; do
    run_test_and_capture $amount
done

echo "All tests completed. Data written to gas_data.csv."
