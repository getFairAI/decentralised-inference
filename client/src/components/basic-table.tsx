import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {
  Box,
  Button,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { ApolloError } from '@apollo/client';
import ReplayIcon from '@mui/icons-material/Replay';
import { genLoadingArray } from '@/utils/common';
import OperatorRow from './operator-row';
import { IEdge, ITag } from '@/interfaces/arweave';

/* function createData(
  address: string,
  fee: number,
  availability: number,
  stamps: number,
) {
  return { address, fee, availability, stamps };
}

const rows = [
  createData('l9dPUiV1sY1fwy40gtkPENMx4irfxinkIaF0PiwoLI', 1, 99, 4),
  createData('o2J6dEG47R-4Rc7JgVtMK2MLJurhVdqrBV58cR2ayzA', 0.8, 89, 1),
  createData('Lq2KrMU-VgbpwjzKQiOx5tpRW6NZ-cGoelP-YCYdzMg', 4, 95, 8),
  createData('Du-4Lq_1NiY9A1KSuWc0WbUKs99lxHMiFA3OkfMhkFw', 3, 100, 11),
  createData('H_5-R2rOlBnPQL1yo8Kj2B8wNjYnZOAzMTQTeAia0k4', 0.6, 87, 15),
]; */

export default function BasicTable(props: {
  operators: IEdge[],
  loading: boolean,
  error?: ApolloError,
  state: IEdge,
  retry: () => void,
}) {
  const mockArray = genLoadingArray(10);

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell variant='head'>
                <Typography sx={{ fontWeight: 'bold' }}>Address</Typography>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Typography sx={{ fontWeight: 'bold' }}>Registration&nbsp;</Typography>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Typography sx={{ fontWeight: 'bold' }}>Fee&nbsp;(Ar)</Typography>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Tooltip
                  title={'Represents the operator availability in the last 100 transactions'}
                  placement='top'
                >
                  <Typography sx={{ fontWeight: 'bold' }}>Status</Typography>
                </Tooltip>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Typography sx={{ fontWeight: 'bold' }}>Stamps&nbsp;</Typography>
              </TableCell>
              <TableCell variant='head' align='right'>
                <Typography sx={{ fontWeight: 'bold' }}>Actions&nbsp;</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.error ? (
              <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell colSpan={6}>
                  <Typography alignItems='center' display='flex' flexDirection='column'>
                    Could not Fetch Registered Operators for this Model.
                    <Button
                      sx={{ width: 'fit-content' }}
                      endIcon={<ReplayIcon />}
                      onClick={props.retry}
                    >
                      Retry
                    </Button>
                  </Typography>
                </TableCell>
              </TableRow>
            ) : props.loading ? (
              mockArray.map((val) => {
                return (
                  <TableRow key={val} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell align='right' colSpan={6} scope='row'>
                      <Typography>
                        <Skeleton variant='rounded' animation={'wave'}></Skeleton>
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              props.operators.map((row) => (
                <OperatorRow key={row.node.id} operatorTx={row} modelCreator={props.state.node.owner.address}
                  modelName={props.state.node.tags.find((el: ITag) => el.name === 'Model-Name')?.value as string}
                  state={props.state}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
