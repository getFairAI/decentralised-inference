import { DEFAULT_TAGS, REGISTER_OPERATION, TAG_NAMES } from '@/constants';
import { IEdge } from '@/interfaces/arweave';
import { QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import { parseWinston } from '@/utils/arweave';
import { useQuery } from '@apollo/client';
import { Box, Button, Card, CardActionArea, Container, Skeleton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReplayIcon from '@mui/icons-material/Replay';
import { findTag } from '@/utils/common';

interface Element {
  name: string;
  txid: string;
  uploader: string;
  avgFee: string;
  modelFee: string;
  totalOperators: number;
}

const ModelCard = ({ modelTx }: { modelTx: IEdge }) => {
  const navigate = useNavigate();
  const [cardData, setCardData] = useState<Element>();
  const elementsPerPage = 5;

  const tags = [
    ...DEFAULT_TAGS,
    { name: TAG_NAMES.operationName, values: [ REGISTER_OPERATION ]},
    {
      name: TAG_NAMES.modelName,
      values: [ findTag(modelTx, 'modelName') ],
    },
    { name: TAG_NAMES.modelCreator, values: [ findTag(modelTx, 'modelCreator') ] },
  ];
  // get all operatorsRegistration for the model
  const { data, loading, error, refetch, fetchMore } = useQuery(QUERY_REGISTERED_OPERATORS, {
    variables: { tags, first: elementsPerPage },
    skip: !modelTx,
  });

  useEffect(() => {
    if (data && data.transactions && data.transactions.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.transactions.edges[data.transactions.edges.length - 1].cursor,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return Object.assign({}, prev, {
            transactions: {
              edges: [...prev.transactions.edges, ...fetchMoreResult.transactions.edges],
              pageInfo: fetchMoreResult.transactions.pageInfo,
            },
          });
        },
      });
    } else if (data && data.transactions) {
      const uniqueOperators: IEdge[] = [];
      const registrations: IEdge[] = data.transactions.edges;

      // filter registratiosn for same model (only keep latest one per operator)
      registrations.map((op: IEdge) =>
        uniqueOperators.filter((unique) => op.node.owner.address === unique.node.owner.address)
          .length > 0
          ? undefined
          : uniqueOperators.push(op),
      );

      const opFees = uniqueOperators.map((op) => {
        const fee = findTag(op, 'operatorFee');
        if (fee) return parseFloat(fee);
        else return 0;
      });
      const average = (arr: number[]) => arr.reduce((p, c) => p + c, 0) / arr.length;
      const avgFee = parseWinston(average(opFees).toString());
      const modelFee = findTag(modelTx, 'modelFee');

      setCardData({
        name: findTag(modelTx, 'modelName') || 'Name not Available',
        txid: findTag(modelTx, 'modelTransaction') || 'Transaction Not Available',
        uploader: modelTx.node.owner.address,
        modelFee: parseWinston(modelFee) || 'Model Fee Not Available',
        avgFee,
        totalOperators: uniqueOperators.length,
      });
    }
  }, [data]); // data changes

  const handleCardClick = () => {
    navigate(`/model/${encodeURIComponent(cardData?.txid || 'error')}/register`, {
      state: modelTx,
    });
  };

  return (
    <Card>
      <Box>
        {error ? (
          <Container>
            <Typography alignItems='center' display='flex' flexDirection='column'>
              Could not Fetch Registered Operators.
              <Button
                sx={{ width: 'fit-content' }}
                endIcon={<ReplayIcon />}
                onClick={() => refetch({ tags })}
              >
                Retry
              </Button>
            </Typography>
          </Container>
        ) : (
          <CardActionArea onClick={handleCardClick}>
            <Typography>Name: {cardData?.name}</Typography>
            <Typography>Transaction id: {cardData?.txid}</Typography>
            <Typography>Creator: {cardData?.uploader}</Typography>
            {loading ? (
              <>
                <Typography>
                  <Skeleton animation={'wave'} />
                </Typography>
                <Typography>
                  <Skeleton animation={'wave'} />
                </Typography>
                <Typography>
                  <Skeleton animation={'wave'} />
                </Typography>
              </>
            ) : (
              <>
                <Typography>
                  Model Fee:{' '}
                  {Number.isNaN(cardData?.modelFee) || cardData?.modelFee === 'NaN'
                    ? 'Invalid Fee'
                    : `${cardData?.modelFee} AR`}
                </Typography>
                <Typography>
                  Average Fee:{' '}
                  {Number.isNaN(cardData?.avgFee) || cardData?.avgFee === 'NaN'
                    ? 'Not enough Operators for Fee'
                    : `${cardData?.avgFee} AR`}
                </Typography>
                <Typography>Total Operators: {cardData?.totalOperators}</Typography>
              </>
            )}
          </CardActionArea>
        )}
      </Box>
    </Card>
  );
};

export default ModelCard;
