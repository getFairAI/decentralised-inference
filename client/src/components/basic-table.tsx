import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, IconButton, TablePagination, Tooltip, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import { ApolloError } from '@apollo/client';
import CopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate } from 'react-router-dom';
import { IEdge } from '@/interfaces/arweave';
import arweave from '@/utils/arweave';

export interface RowData {
  quantityAR: number;
  address: string;
  fee: string;
  availability: number;
  stamps: number;
  registrationTimestamp: string;
  modelName: string;
  modelCreator: string;
  modelTransaction: string;
}

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
  data: RowData[];
  loading: boolean;
  error?: ApolloError;
  state?: IEdge;
}) {
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [page, setPage] = React.useState(0);
  const navigate = useNavigate();

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell variant='head'>Address</TableCell>
              <TableCell variant='head' align='right'>
                Registration&nbsp;
              </TableCell>
              <TableCell variant='head' align='right'>
                Fee&nbsp;(Ar)
              </TableCell>
              <TableCell variant='head' align='right'>
                Response Rate&nbsp;(%)
              </TableCell>
              <TableCell variant='head' align='right'>
                Stamps&nbsp;
              </TableCell>
              <TableCell variant='head' align='right'>
                Actions&nbsp;
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.data.map((row, idx) => (
              <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell scope='row'>
                  <Tooltip title={row.address}>
                    <Typography>
                      {row.address.slice(0, 10)}...{row.address.slice(-2)}
                      <IconButton
                        size='small'
                        onClick={() => {
                          navigator.clipboard.writeText(row.address);
                        }}
                      >
                        <CopyIcon fontSize='inherit' />
                      </IconButton>
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align='right'>{row.registrationTimestamp}</TableCell>
                <TableCell align='right'>{arweave.ar.winstonToAr(row.fee)}</TableCell>
                <TableCell align='right'>{row.availability}</TableCell>
                <TableCell align='right'>{row.stamps}</TableCell>
                <TableCell align='right'>
                  <Tooltip title='History'>
                    <IconButton
                      onClick={() =>
                        navigate(`/operators/details/${row.address}`, {
                          state: {
                            modelName: row.modelName,
                            modelCreator: row.modelCreator,
                            operatorFee: row.fee,
                          },
                        })
                      }
                    >
                      <HistoryIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Execute'>
                    <IconButton
                      onClick={() =>
                        navigate(`../chat/${row.address}`, {
                          state: {
                            modelName: row.modelName,
                            modelCreator: row.modelCreator,
                            fee: row.fee,
                            modelTransaction: row.modelTransaction,
                            fullState: props.state,
                          },
                        })
                      }
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component='div'
        count={props.data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
}
