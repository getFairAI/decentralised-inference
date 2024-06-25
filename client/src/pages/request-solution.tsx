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

import { PROTOCOL_NAME, PROTOCOL_VERSION, TAG_NAMES } from '@/constants';
import { StyledMuiButton } from '@/styles/components';
import { postOnArweave } from '@fairai/evm-sdk';
import Close from '@mui/icons-material/Close';
import { Box, Button, Chip, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { UseFormSetValue, useController, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

const Keyword = ({
  currentKeyword,
  keywords,
  setValue,
}: {
  currentKeyword: string;
  keywords: string[];
  setValue: UseFormSetValue<{
    title: string;
    description: string;
    keywords: string[];
  }>;
}) => {
  const onDelete = useCallback(() => {
    setValue(
      'keywords',
      keywords.filter((keyword) => keyword !== currentKeyword),
    );
  }, [currentKeyword, keywords, setValue]);

  return <Chip label={currentKeyword} onDelete={onDelete} variant='outlined' />;
};

const RequestSolution = () => {
  const [requestSuccessful, setRequestSuccessfull] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleBack = useCallback(() => navigate(-1), [navigate]);
  const { control, formState, setValue, handleSubmit } = useForm<{
    title: string;
    description: string;
    keywords: string[];
  }>({
    defaultValues: {
      title: '',
      description: '',
      keywords: [],
    },
  });
  const { field: title } = useController({ control, name: 'title', rules: { required: true } });
  const { field: description } = useController({
    control,
    name: 'description',
    rules: { required: true },
  });

  const keywords = useWatch({ control, name: 'keywords' });

  const handleClick = async (data: { title: string; description: string; keywords: string[] }) => {
    try {
      const tags = [
        { name: TAG_NAMES.protocolName, value: PROTOCOL_NAME },
        { name: TAG_NAMES.protocolVersion, value: PROTOCOL_VERSION },
        { name: TAG_NAMES.operationName, value: 'Request-Solution' },
        { name: TAG_NAMES.unixTime, value: (Date.now() / 1000).toString() },
      ];

      if (data.keywords.length > 0) {
        // insert keywords before the last tag
        tags.splice(tags.length - 2, 0, {
          name: TAG_NAMES.keywords,
          value: data.keywords.join(','),
        });
      }
      await postOnArweave(JSON.stringify(data), tags);
      setRequestSuccessfull(true);
    } catch (error) {
      setRequestSuccessfull(false);
      enqueueSnackbar('An error occurred while submitting your request', { variant: 'error' });
    }
  };

  const keyDownHandler = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.code === 'Enter') {
        event.preventDefault();
        setValue('keywords', [...keywords, newKeyword]);
        setNewKeyword('');
      }
    },
    [keywords, newKeyword, setValue, setNewKeyword],
  );

  const handleNewKeywordChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNewKeyword(event.target.value);
    },
    [setNewKeyword],
  );

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
        <Typography variant='h2'>Your Request Has been registered.</Typography>
        <Typography variant='body1'>Thank you for your collaboration.</Typography>
        <Button onClick={handleBack} variant='outlined' sx={{ marginTop: '16px' }}>
          Explore Marketplace
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: '-40px' }}
      animate={{ opacity: 1, y: 0, transition: { type: 'smooth', duration: 0.3 } }}
      className='w-full flex justify-center mt-20'
    >
      <Box
        height={'100%'}
        display={'flex'}
        flexDirection={'column'}
        gap={'24px'}
        justifyContent={'center'}
        alignItems={'center'}
        overflow={'auto'}
        width={'100%'}
        maxWidth={'1600px'}
      >
        <Box display={'flex'} justifyContent={'flex-end'} gap={'16px'} width={'65%'}>
          <StyledMuiButton
            onClick={handleBack}
            className='plausible-event-name=Close+Onboarding+Click outlined-secondary fully-rounded'
          >
            <Close />
          </StyledMuiButton>
        </Box>
        <div className='flex gap-3 py-5'>
          <img
            src='./fair-protocol-face-primarycolor.png'
            style={{ width: '40px', objectFit: 'contain' }}
          />
          <Typography variant='h2'>Tell us about your needs</Typography>
        </div>
        <Box
          display={'flex'}
          flexDirection={'column'}
          justifyContent={'center'}
          alignItems={'center'}
          gap={'16px'}
          width={'65%'}
        >
          <Typography textAlign={'left'} width={'100%'} fontWeight={500}>
            Please provide a short sentence that describes your problem
          </Typography>
          <TextField
            value={title.value}
            onChange={title.onChange}
            inputRef={title.ref}
            onBlur={title.onBlur}
            fullWidth
            variant='outlined'
            sx={{ backgroundColor: 'white', overflow: 'hidden', borderRadius: '8px' }}
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
          <Typography textAlign={'left'} width={'100%'} fontWeight={500}>
            Please provide a detailed description of your problem
          </Typography>
          <TextField
            value={description.value}
            onChange={description.onChange}
            inputRef={description.ref}
            onBlur={description.onBlur}
            multiline
            minRows={7}
            fullWidth
            variant='outlined'
            sx={{ backgroundColor: 'white', overflow: 'hidden', borderRadius: '8px' }}
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
          <Typography textAlign={'left'} width={'100%'} fontWeight={500}>
            Add a few keywords
          </Typography>
          <TextField
            fullWidth
            multiline
            variant='outlined'
            value={newKeyword}
            onChange={handleNewKeywordChanged}
            onKeyDown={keyDownHandler}
            sx={{ backgroundColor: 'white', overflow: 'hidden', borderRadius: '8px' }}
            InputProps={{
              startAdornment: (
                <Box display={'flex'} flexWrap='wrap' gap={'8px'} paddingRight={'8px'}>
                  {keywords.map((keyword) => (
                    <Keyword
                      key={keyword}
                      currentKeyword={keyword}
                      keywords={keywords}
                      setValue={setValue}
                    />
                  ))}
                </Box>
              ),
            }}
          />
        </Box>
        <Box display={'flex'} justifyContent={'flex-end'} gap={'16px'} width={'65%'}>
          <StyledMuiButton
            onClick={handleSubmit(handleClick)}
            className='plausible-event-name=Submit+Request+Click secondary'
          >
            <Close />
            Cancel
          </StyledMuiButton>
          <StyledMuiButton
            onClick={handleSubmit(handleClick)}
            className='plausible-event-name=Submit+Request+Click primary'
            disabled={!formState.isDirty || !formState.isValid || formState.isSubmitted}
          >
            <CheckRoundedIcon />
            Save and Submit
          </StyledMuiButton>
        </Box>
      </Box>
    </motion.div>
  );
};

export default RequestSolution;
