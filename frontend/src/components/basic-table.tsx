import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, TablePagination } from '@mui/material';

function createData(
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
];

export default function BasicTable() {

  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [page, setPage] = React.useState(0);

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
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell variant='head'>Address</TableCell>
              <TableCell variant='head' align="right">Fee&nbsp;(%)</TableCell>
              <TableCell variant='head' align="right">Availability&nbsp;(%)</TableCell>
              <TableCell variant='head' align="right">Stamps&nbsp;</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.address}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell scope="row">
                  {row.address}
                </TableCell>
                <TableCell align="right">{row.fee}</TableCell>
                <TableCell align="right">{row.availability}</TableCell>
                <TableCell align="right">{row.stamps}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
    
  );
}