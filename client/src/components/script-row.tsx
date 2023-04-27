import { IEdge } from '@/interfaces/arweave';
import { Checkbox, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import CopyIcon from '@mui/icons-material/ContentCopy';
import { parseWinston } from '@/utils/arweave';
import { findTag } from '@/utils/common';

/**
 * @description React Function component to handle displaying a row for an operator
 * @param props { operatorTx, modelCreator, modelName, state }
 * @returns
 */
const ScriptRow = ({
  scriptTx,
  index,
  isSelected,
  setSelected,
}: {
  scriptTx: IEdge;
  index: number;
  isSelected: boolean;
  setSelected: (index: number) => void;
}) => {
  return (
    <>
      <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell scope='row'>
          <Tooltip title={scriptTx.node.owner.address}>
            <Typography>
              {scriptTx.node.owner.address.slice(0, 10)}...
              {scriptTx.node.owner.address.slice(-2)}
              <IconButton
                size='small'
                onClick={() => {
                  scriptTx.node.owner.address &&
                    navigator.clipboard.writeText(scriptTx.node.owner.address);
                }}
              >
                <CopyIcon fontSize='inherit' />
              </IconButton>
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align='right'>{findTag(scriptTx, 'scriptName')}</TableCell>
        <TableCell align='right'>
          {new Date(parseFloat(findTag(scriptTx, 'unixTime') as string) * 1000).toLocaleString()}
        </TableCell>
        <TableCell align='right'>{parseWinston(findTag(scriptTx, 'scriptFee'))}</TableCell>
        <TableCell align='right'>{0}</TableCell>
        <TableCell align='right'>
          <Checkbox color='primary' checked={isSelected} onChange={() => setSelected(index)} />
        </TableCell>
      </TableRow>
    </>
  );
};

export default ScriptRow;
