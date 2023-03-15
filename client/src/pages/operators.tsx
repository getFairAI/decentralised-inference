import { DEFAULT_TAGS, MARKETPLACE_FEE, REGISTER_OPERATION_TAG } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { LIST_MODELS_QUERY, QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import { parseWinston } from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import { Container, Box, Stack, Card, CardActionArea, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Element {
  name: string;
  txid: string;
  uploader: string;
  avgFee: string;
  modelFee: string;
  totalOperators: number;
}
const Operators = () => {
  const navigate = useNavigate();
  const [elements, setElements] = useState<Element[]>([]);
  const [txs, setTxs] = useState<IEdge[]>([]);

  // filter only models who paid the correct Marketplace fee
  const handleCompleted = (data: IEdge[]) =>
    setTxs(data.filter((el) => el.node.quantity.ar !== MARKETPLACE_FEE));

  const { loading, error } = useQuery(LIST_MODELS_QUERY, {
    onCompleted: handleCompleted,
  });

  const tags = [...DEFAULT_TAGS, REGISTER_OPERATION_TAG];
  // get all operatorsRegistration
  const { data: operatorsData } = useQuery(QUERY_REGISTERED_OPERATORS, {
    variables: { tags },
    skip: txs.length <= 0,
  });

  useEffect(() => {
    if (operatorsData) {
      setElements(
        txs.map((el: IEdge) => {
          const uniqueOperators: IEdge[] = [];
          const modelOperators = operatorsData.filter(
            (op: IEdge) =>
              op.node.tags.find((tag) => tag.name === 'Model-Name')?.value ===
                el.node.tags.find((tag) => tag.name === 'Model-Name')?.value &&
              op.node.tags.find((tag) => tag.name === 'Model-Creator')?.value ===
                el.node.owner.address,
          );
          // get only latest operators registrations
          modelOperators.map((op: IEdge) =>
            uniqueOperators.filter((unique) => op.node.owner.address === unique.node.owner.address)
              .length > 0
              ? undefined
              : uniqueOperators.push(op),
          );
          const opFees = uniqueOperators.map((op) => {
            const fee = op.node.tags.find((el) => el.name === 'Operator-Fee')?.value;
            if (fee) return parseFloat(fee);
            else return 0;
          });
          const average = (arr: number[]) => arr.reduce((p, c) => p + c, 0) / arr.length;
          const avgFee = parseWinston(average(opFees).toString());
          const modelFee = el.node.tags.find((el) => el.name === 'Model-Fee')?.value;

          return {
            name:
              el.node.tags.find((el) => el.name === 'Model-Name')?.value || 'Name not Available',
            txid:
              el.node.tags.find((el) => el.name === 'Model-Transaction')?.value ||
              'Transaction Not Available',
            uploader: el.node.owner.address,
            modelFee:
              parseWinston(modelFee) ||
              'Model Fee Not Available',
            avgFee,
            totalOperators: uniqueOperators.length,
          };
        }),
      );
    }
  }, [operatorsData]); // operatorsData changes

  if (loading) {
    return <h2>Loading...</h2>;
  } else if (error) {
    console.error(error);
    return null;
  }

  const handleCardClick = (idx: number) => {
    navigate(`/model/${encodeURIComponent(elements[idx].txid)}/register`, { state: txs[idx] });
  };

  return (
    <>
      <Container sx={{ top: '64px', position: 'relative' }}>
        <Box>
          <Stack spacing={4} sx={{ margin: '16px' }}>
            {elements.map((el: Element, idx: number) => (
              <Card key={idx}>
                <Box>
                  <CardActionArea onClick={() => handleCardClick(idx)}>
                    <Typography>Name: {el.name}</Typography>
                    <Typography>Transaction id: {el.txid}</Typography>
                    <Typography>Creator: {el.uploader}</Typography>
                    <Typography>Model Fee: {Number.isNaN(el.modelFee) || el.modelFee === 'NaN' ? 'Invalid Fee' : `${el.modelFee} AR`}</Typography>
                    <Typography>
                      Average Fee:{' '}
                      {Number.isNaN(el.avgFee) || el.avgFee === 'NaN' ? 'Not enough Operators for Fee' : `${el.avgFee} AR`}
                    </Typography>
                    <Typography>Total Operators: {el.totalOperators}</Typography>
                  </CardActionArea>
                </Box>
              </Card>
            ))}
          </Stack>
        </Box>
      </Container>
    </>
  );
};

export default Operators;
