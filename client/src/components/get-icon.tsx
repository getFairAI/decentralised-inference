import { GitHub, Article, Settings, Twitter, Logout } from '@mui/icons-material';

type Props = {
    input: string;
  };

const GetIcon = ({ input }: Props): JSX.Element => {


    switch (input) {
        case 'Bundlr Settings':
            return <Settings></Settings>;
        case 'Whitepaper':
            return <Article></Article>;
        case 'Github':
            return <GitHub></GitHub>;
        case 'Twitter':
            return <Twitter></Twitter>;    
        default:
            return <Logout></Logout>;
     
    }
};  

export default GetIcon;
