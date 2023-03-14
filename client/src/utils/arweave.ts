import { NET_ARWEAVE_URL } from '@/constants';
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: NET_ARWEAVE_URL.split('//')[1],
  port: 443,
  protocol: 'https',
});

export default arweave;