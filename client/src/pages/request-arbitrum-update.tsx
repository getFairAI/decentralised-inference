/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import DebounceButton from '@/components/debounce-button';
import { PROTOCOL_NAME, PROTOCOL_VERSION, TAG_NAMES } from '@/constants';
import { postOnArweave } from '@fairai/evm-sdk';
import Close from '@mui/icons-material/Close';
import { Box, Button, IconButton, TextField, Typography, Switch, Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import ContentCopy from '@mui/icons-material/ContentCopy';

const RequestArbitrumUpdate = () => {
  const [requestSuccessful, setRequestSuccessfull] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleBack = useCallback(() => navigate(-1), [navigate]);
  const { control, formState, handleSubmit } = useForm<{
    title: string;
    links: string;
    feedback: string;
    keepLink: boolean;
  }>({
    defaultValues: {
      title: '',
      links: '',
      feedback: '',
      keepLink: true,
    },
  });
  const { field: title } = useController({ control, name: 'title', rules: { required: true } });
  const { field: links } = useController({
    control,
    name: 'links',
    rules: { required: true },
  });
  const { field: feedback } = useController({
    control,
    name: 'feedback',
    rules: { required: false },
  });
  const { field: keepLink } = useController({
    control,
    name: 'keepLink',
    rules: { required: false },
  });


  const generateCode = (length = 10) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      code += charset[array[i] % charset.length];
    }
    return code;
  };

  const handleClick = async (data: {
    title: string;
    links: string;
    feedback: string;
    keepLink: boolean;
  }) => {
    try {
      const tags = [
        { name: TAG_NAMES.protocolName, value: PROTOCOL_NAME },
        { name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION },
        { name: TAG_NAMES.operationName, value: 'Request-Arbitrum-Update-demo' },
        { name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() },
      ];

      const code = generateCode();
      setVerificationCode(code);

      const updatedData = {
        ...data,
        verificationCode: code,
      };

      await postOnArweave(JSON.stringify(updatedData), tags);
      setRequestSuccessfull(true);
    } catch (error) {
      setRequestSuccessfull(false);
      enqueueSnackbar('An error occurred while submitting your request', { variant: 'error' });
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(verificationCode);
    enqueueSnackbar('Code copied to clipboard', { variant: 'success' });
  };

  if (requestSuccessful) {
    return (
      <Box
        height={'100%'}
        display={'flex'}
        flexDirection={'column'}
        gap={'24px'}
        justifyContent={'center'}
        alignItems={'center'}
        overflow={'auto'}
      >
        <Typography variant='h2'>Your request has been successfully registered!</Typography>
        <Typography variant='body1'>
          We’ve contacted all the projects using the contact information provided in their
          LTIPP/STIP proposals. To ensure that only authorized individuals can update the data, we
          need one final step from you.
        </Typography>
        <Typography variant='body1'>
          Please send us a message back with the following code to validate your authorization:
        </Typography>
        <Box display='flex' alignItems='center'>
          <Typography variant='h4' sx={{ fontWeight: 'bold', marginRight: '8px' }}>
            Your Code: {verificationCode}
          </Typography>
          <IconButton onClick={handleCopyToClipboard} sx={{ padding: 0 }}>
            <ContentCopy fontSize='small' />
          </IconButton>
        </Box>
        <Button onClick={handleBack} variant='outlined' sx={{ marginTop: '16px' }}>
          Explore Marketplace
        </Button>
      </Box>
    );
  }

  return (
    <Box
      height={'100%'}
      display={'flex'}
      flexDirection={'column'}
      gap={'24px'}
      justifyContent={'center'}
      alignItems={'center'}
      overflow={'auto'}
    >
      <Box display={'flex'} justifyContent={'flex-end'} gap={'16px'} width={'65%'}>
        <IconButton
          onClick={handleBack}
          sx={{
            borderRadius: '10px',
          }}
          className='plausible-event-name=Close+Onboarding+Click'
        >
          <Close />
        </IconButton>
      </Box>
      <Typography variant='h1'>Data Source Update for LTIPP/STIP AI Solution</Typography>
      <Box
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'center'}
        alignItems={'center'}
        gap={'16px'}
        width={'65%'}
      >
        <Typography textAlign={'left'} width={'100%'}>
          Project name
        </Typography>
        <TextField
          value={title.value}
          onChange={title.onChange}
          inputRef={title.ref}
          placeholder='My project'
          onBlur={title.onBlur}
          fullWidth
          variant='outlined'
        />
      </Box>
      <Box
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'center'}
        alignItems={'center'}
        gap={'16px'}
        width={'65%'}
      >
        <Typography textAlign={'left'} width={'100%'}>
          Please provide a list of links to be used as a source of information for your project
        </Typography>
        <TextField
          value={links.value}
          onChange={links.onChange}
          inputRef={links.ref}
          placeholder='Link1, Link2, Link3'
          onBlur={links.onBlur}
          multiline
          minRows={3}
          fullWidth
          variant='outlined'
        />
        <Typography textAlign={'left'} width={'100%'}>
          Feedback or suggestions
        </Typography>
        <TextField
          value={feedback.value}
          onChange={feedback.onChange}
          inputRef={feedback.ref}
          onBlur={feedback.onBlur}
          multiline
          minRows={3}
          fullWidth
          variant='outlined'
        />
      </Box>
      <Box display={'flex'} justifyContent={'flex-start'} alignItems={'center'} width={'65%'}>
        <Typography>Keep my Proposal Link</Typography>
        <Tooltip title='This will ensure that the STIP or LTIPP proposal link for your project remains in the information sources, along with the new links you added in the previous point.'>
          <InfoOutlined fontSize='small' color='action' />
        </Tooltip>
        <Switch
          value={keepLink.value}
          checked={keepLink.value}
          onChange={keepLink.onChange}
          inputProps={{ 'aria-label': 'Keep my Proposal' }}
        />
      </Box>
      <Box display={'flex'} justifyContent={'flex-end'} gap={'16px'} width={'65%'}>
        <DebounceButton
          variant='contained'
          onClick={handleSubmit(handleClick)}
          className='plausible-event-name=Submit+Request+Click'
          disabled={!formState.isDirty || !formState.isValid || formState.isSubmitted}
        >
          <Typography>Submit</Typography>
        </DebounceButton>
      </Box>
    </Box>
  );
};

export default RequestArbitrumUpdate;
