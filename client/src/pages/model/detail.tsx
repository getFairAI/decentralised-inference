import { Avatar, Button, Card, CardContent, Container, Divider, FormControl, InputLabel, MenuItem, Select, SvgIcon, TextField, Typography } from "@mui/material";
import { Box } from "@mui/system";
import BasicTable, { RowData } from "@/components/basic-table";;
import Stamp from '@/components/stamp';
import { useParams, useRouteLoaderData } from "react-router-dom";
import { ApolloError, useLazyQuery, useQuery } from "@apollo/client";
import { QUERY_OPERATOR_RESULTS_RESPONSES, QUERY_REGISTERED_OPERATORS } from "@/queries/graphql";
import { DEFAULT_TAGS, MODEL_INFERENCE_REQUEST_TAG, MODEL_INFERENCE_RESULT_TAG, REGISTER_OPERATION_TAG } from "@/constants";
import { IEdge, INode, ITransactions } from "@/interfaces/arweave";
import { useEffect, useState } from "react";

const Detail = () => { 
  const { data }: any = useRouteLoaderData('model');
  const { txid } = useParams();
  const [ operatorsData, setOperatorsData ] = useState<RowData[]>([]);
  
  const tags = [
    ...DEFAULT_TAGS,
    REGISTER_OPERATION_TAG,
    {
      name: "Model-Transaction",
      values: [ txid ]
    },
  ];
  const { data: queryData, loading, error } = useQuery(QUERY_REGISTERED_OPERATORS, {
    variables: { tags },
  })

  const [ getFollowupQuery, followupResult ] = useLazyQuery(QUERY_OPERATOR_RESULTS_RESPONSES);

  useEffect(() => {
    if (queryData) {
      const owners = queryData.map((el: IEdge) => el.node.owner.address);
      const tagsRequests = [
        ...tags.filter(el => el.name !== REGISTER_OPERATION_TAG.name), // remove register operation tag
        MODEL_INFERENCE_REQUEST_TAG
      ]
      const tagsResults = [
        ...tags.filter(el => el.name !== REGISTER_OPERATION_TAG.name), // remove register operation tag
        MODEL_INFERENCE_RESULT_TAG
      ];

      getFollowupQuery({variables: {
        owners: owners,
        tagsRequests,
        tagsResults
      }});
    }
  }, [ queryData ]);

  useEffect(() => {
    console.log(followupResult)
    if (followupResult.loading) console.log('loading');
    if (followupResult.error) console.log(error, 'err');
    if (followupResult.data) {
      const requests = followupResult.data.requests as IEdge[];
      const results = followupResult.data.results as IEdge[];
      console.log(requests);
      console.log(results);
      const parsed: RowData[] = queryData.map((el: IEdge) => ({
        address: el.node.owner.address,
        stamps: Math.round(Math.random() * 100),
        fee: el.node.tags.find(el => el.name === 'Model-Fee')?.value || 0,
        registrationTimestamp: el.node.block ? new Date(el.node.block.timestamp * 1000).toLocaleDateString() : 'Pending',
        availability: (
          results.filter(res => el.node.owner.address === res.node.owner.address).length /
          requests.filter(req => el.node.owner.address === req.node.recipient).length
        ) * 100 || 0,
      }));
      setOperatorsData(parsed);
    }
  }, [ followupResult ])

  return (
    <Container sx={{top: '64px', position: 'relative'}}>
      <Box sx={{ margin: '8px' }}>
        <Card>
          <CardContent>
            <Box display={'flex'} justifyContent={'space-evenly'} marginBottom={'16px'}>
              <Box display={'flex'} flexDirection={'column'} justifyContent={'space-between'}>
                <Avatar sx={ { width: '180px', height: '180px' }}/>
                  <Button variant="outlined" startIcon={
                    <SvgIcon>
                      <Stamp />
                    </SvgIcon>}
                  >
                    Stamp
                  </Button>
              </Box>
              <Box>
                <TextField label="Name" variant="outlined" value={''} fullWidth inputProps={{ readOnly: true }}/>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={'text'}
                    label="Category"
                    inputProps={{ readOnly: true }}
                  >
                    <MenuItem value={'text'}>Text</MenuItem>
                    <MenuItem value={'audio'}>Audio</MenuItem>
                    <MenuItem value={'video'}>Video</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Description"
                  variant="outlined"
                  multiline
                  value={''}
                  inputProps={{ readOnly: true }}
                  style={{ width: '100%' }}
                  margin='normal'
                  sx={{ marginBottom: 0 }}
                  minRows={2}
                  maxRows={3}
                />
              </Box>
            </Box>
            <Divider textAlign='left'>
              <Typography variant="h6">Operators</Typography>
            </Divider>
            <BasicTable data={operatorsData} loading={loading || followupResult.loading} error={error || followupResult.error}></BasicTable>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default Detail;