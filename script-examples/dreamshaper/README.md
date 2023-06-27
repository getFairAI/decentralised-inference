# Instructions on how to install DreamShaper

## Depedencies
To use this library, you need to have:


1. Download model file and rename to `dreamshaper_631BakedVae-full.safetensors`

2. Download the script files and extract

3. Place model file in scripts folder 

4. Place your arweave wallet file in the root folder under the name `wallet.json`
**Note:** Wallet must have funds in Bundlr node 1

5. (Optional) Create a python virtual environment
```sh
python3 -m venv path/to/set/environment
source path/to/set/environment/bin/activate
```

1. Install Requirements
```
pip install -r requirements.txt
```
1. Open a terminal in the scripts folder (with the python virtual environment active if using venv)
```sh
python inference.py # or python inference-cpu.py
```
**Note:** Cpu inference is much slower than using gpu

1. Using another terminal in same folder run
```sh
npm install
npm start
```

*Optional:* If you want to test the inference first, after putting the model on the same folder as the other files run instead the test script with

```bash
ts-node dreamshaper-inference-test.ts
```

#### This is all for today, congrats if you made this far!
