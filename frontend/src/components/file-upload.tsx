
import useArweave from '@/context/arweave';
import { Alert, Box, Button, Paper, Snackbar } from '@mui/material';
import React, {ChangeEvent, createRef, DragEvent, ReactNode, useRef, useState} from 'react';
import { WebBundlr } from "@bundlr-network/client";
import CustomProgress from './progress';
import { file } from 'arbundles';
import { Container } from '@mui/system';

const FileUpload = (props: any & { name: string, description: string }) => {

  const {
    arweave,
    addresses,
  } = useArweave();
  const [ open, setOpen ] = useState(false);
  const [ progress, setProgress ] = useState(0);

  
  const fileInput = useRef<HTMLInputElement | null>(null);

  const handleFile = async (files: FileList) => {
    setOpen(true);
    const file = files?.item(0);
    const buffer = await file?.arrayBuffer();
    
    const tx = await arweave.createTransaction({
      data: buffer
    });
    // await signTx(tx);
    tx.addTag('test', 'test-upload');
    /* tx.addTag('name', props.name);
    tx.addTag('description', props.description); */

    await arweave.transactions.sign(tx);
  
    const uploader = await arweave.transactions.getUploader(tx);

    const worker  = new Worker(new URL("../workers/upload.ts", import.meta.url));
    worker.postMessage([JSON.stringify(uploader), buffer]);
    
    worker.onmessage = (e: MessageEvent<any>) => {
      if (e.data.isComplete) {
        worker.terminate();
        setProgress(100)
        setOpen(false);
        setProgress(0);
      } else {
        setProgress(e.data.pct);
        // update progress
      }
    };
  }

  const handleFileInput = async (e: ChangeEvent) => {
    await handleFile(fileInput.current?.files!);
  }

  const handleClose = () => {
    setOpen(false);
  }

  const mint = async () => {
    const addr = await arweave.wallets.getAddress();
    const tokens = arweave.ar.arToWinston('100');
    // mint some tokens
    await arweave.api.get(`mint/${addr}/${tokens}`)
    await arweave.api.get('mine');
  }

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    await handleFile(event.dataTransfer.files);
  }

  return (
    <>
      {/* <Button onClick={mint}>Mint TOkens</Button> */}
      <Paper elevation={3}>
        <Container>
          <Box>
            <div onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDrop={handleDrop}></div>
            <input type="file" ref={fileInput} onChange={handleFileInput} style={{ display: 'none' }}/>
            <Button id="fileSelect" type="button" variant="contained" onClick={() => fileInput.current?.click()}>Choose a file</Button>
          </Box>
          
        </Container>
        
      </Paper>
      
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        open={open}
        onClose={handleClose}
        ClickAwayListenerProps={{ onClickAway: () => null }}
      >
        <Alert severity='info'  sx={{ width: '100%', minWidth: '100px'}}>
          Uploading...
          <CustomProgress value={progress}></CustomProgress>
        </Alert>
        
      </Snackbar>
    </>
  );
}

export default FileUpload;