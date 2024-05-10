
const handleEncrypt = async (payload: { key: string, data: string }) => {
  console.log(payload);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(payload.key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['encrypt']);
  const encData = await crypto.subtle.encrypt('RSA-OAEP', key, new TextEncoder().encode(payload.data));
  self.postMessage({ encData: new TextDecoder('utf-8').decode(encData) });
};

const handleDecrypt = async (payload: { key: string, data: string }) => {
  console.log(payload);
  self.postMessage('Not implemented yet');
};

interface WorkerMessage {
  type: 'encrypt' | 'decrypt',
  payload: {
    key: string,
    data: string
  }
};

const handleWorkerRequest = async (e: MessageEvent<WorkerMessage>) => {
  console.log(e);
  if (e.data.type === 'encrypt') {
    handleEncrypt(e.data.payload);
  } else if (e.data.type === 'decrypt') {
    handleDecrypt(e.data.payload);
  } else {
    self.postMessage('Invalid request');
  }
};

self.onmessage = handleWorkerRequest;

export {};