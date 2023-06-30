import { IContractEdge, IEdge } from '@/interfaces/arweave';
import { Checkbox, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import CopyIcon from '@mui/icons-material/ContentCopy';
import { displayShortTxOrAddr, findTag } from '@/utils/common';
import { useCallback, useMemo } from 'react';

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
  scriptTx: IEdge | IContractEdge;
  index: number;
  isSelected: boolean;
  setSelected: (index: number) => void;
}) => {
  const scriptOwner = useMemo(() => findTag(scriptTx, 'sequencerOwner'), [scriptTx]);

  const handleCopyClick = useCallback(async () => {
    if (scriptOwner) {
      await navigator.clipboard.writeText(scriptOwner);
    } else {
      // do nothing
    }
  }, [scriptOwner, navigator]);

  return (
    <>
      <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell scope='row'>
          <Tooltip title={scriptOwner}>
            <Typography>
              {displayShortTxOrAddr(scriptOwner ?? '')}
              <IconButton size='small' onClick={handleCopyClick}>
                <CopyIcon fontSize='inherit' />
              </IconButton>
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align='right'>{findTag(scriptTx, 'scriptName')}</TableCell>
        <TableCell align='right'>
          {new Date(parseFloat(findTag(scriptTx, 'unixTime') as string) * 1000).toLocaleString()}
        </TableCell>
        <TableCell align='right'>{0}</TableCell>
        <TableCell align='right'>
          <Checkbox color='primary' checked={isSelected} onChange={() => setSelected(index)} />
        </TableCell>
      </TableRow>
    </>
  );
};

export default ScriptRow;
