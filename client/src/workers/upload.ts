/* eslint-disable no-restricted-globals */
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: '127.0.0.1',
  port: 1984,
  protocol: 'http',
});

self.onmessage = async (e: MessageEvent<string>) => {
  const uploader = JSON.parse(e.data[0]);
  const buff = e.data[1] as unknown as Uint8Array;
  const resume = await arweave.transactions.getUploader(uploader, buff);

  while (!resume.isComplete) {
    await resume.uploadChunk();
    self.postMessage({
      pct: resume.pctComplete,
      isComplete: resume.isComplete,
      completedChunks: resume.uploadedChunks,
      totalChunks: resume.totalChunks,
    });
  }

  /* self.postMessage(resume.lastResponseStatus); */
};

export {};
