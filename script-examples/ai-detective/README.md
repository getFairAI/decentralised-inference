# Instructions on how to install AI Detective
​
## Depedencies
To use this model, you need to:
​
1. Download model zip file
​
2. Download script zip file
​
3. Extract both files
​
4. Place extracted script folder on your path of preference
​
5. Place extrated model folder on the same folder than the script files
​
6. Place your arweave wallet file in the root folder under the name `wallet.json`

    **Note:** Wallet must have funds in Bundlr node 1
​
7. (Optional) Create a python virtual environment
    ```sh
     python3 -m venv path/to/set/environment
     source path/to/set/environment/bin/activate
    ```

8. Install Requirements

    ```
    pip install -r requirements.txt
    ```

9. Open a terminal in the scripts folder (with the python virtual environment active if using venv)

    ```sh
    python infer.py
    ```

10. Using another terminal in same folder run
    ```sh
    npm install
    npm start
    ```
​
*Optional:* If you want to test the inference first, after putting the model on the same folder as the other files run instead the test script with
​
```bash
ts-node ai-detective-inference-test.ts
```
​
#### This is all for today, congrats if you made this far!