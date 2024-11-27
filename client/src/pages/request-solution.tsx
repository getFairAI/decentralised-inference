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
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { UseFormSetValue, useController, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { NumericFormat } from 'react-number-format';
import { DateField, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

const defaultKeywordsList = [
  'AI',
  'AI Assistant',
  'AI Chat Support',
  'AI Coding',
  'Audio Generation',
  'Audio Editing',
  'Bot',
  'Crypto',
  'Game Development',
  'Data Scraping',
  'Documents/Office',
  'Code Analisys',
  'DeFi',
  'Social Media',
  'Trading',
  'Web2',
  'Web3',
  'Image Generation',
  'Image Editing',
  'Video Generation',
  'Video Editing',
  'Text-To-Speech',
  'Speech-To-Text',
  'Voice Recognition',
  'Smart Contract',
  'Technology',
  'Hardware Control',
  'Database Management',
  'Other (specify)',
];

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

  return (
    <Chip
      label={currentKeyword}
      onDelete={onDelete}
      variant='filled'
      color='primary'
      className='font-bold'
    />
  );
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
      keywords: ['asd'],
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
    <div className='w-full flex justify-center mt-10 animate-slide-down'>
      <div className='w-full flex gap-8 flex-col max-w-[900px] px-4'>
        <div className='w-full flex justify-end md:justify-between items-center flex-wrap-reverse'>
          <div className='flex flex-grow-0 gap-3 py-5'>
            <img
              src='./fair-protocol-face-primarycolor.png'
              style={{ width: '40px', objectFit: 'contain' }}
            />
            <Typography variant='h2'>
              Create a request: tell the community what you need.
            </Typography>
          </div>

          <div className='flex flex-grow-0 w-fit justify-end'>
            <StyledMuiButton
              onClick={handleBack}
              className='plausible-event-name=Close+Onboarding+Click secondary fully-rounded'
            >
              <Close />
            </StyledMuiButton>
          </div>
        </div>
        <div className='w-full'>
          <Typography width={'100%'} fontWeight={600}>
            1. Provide a short title that describes your problem or idea
          </Typography>
          <Typography width={'100%'} fontWeight={400} fontSize={14} padding={'5px 15px'}>
            This will be shown as the title of your request.
          </Typography>
          <TextField
            value={title.value}
            onChange={title.onChange}
            inputRef={title.ref}
            onBlur={title.onBlur}
            variant='outlined'
            fullWidth
            placeholder='Write a title or subject...'
            sx={{
              backgroundColor: 'white',
              overflow: 'hidden',
              borderRadius: '8px',
              margin: '0px 16px',
              maxWidth: '850px',
            }}
          />
        </div>
        <div className='w-full'>
          <Typography width={'100%'} fontWeight={700}>
            2. Provide a detailed description
          </Typography>
          <Typography width={'100%'} fontWeight={400} fontSize={14} padding={'5px 20px'}>
            Explain your project, what you need, the context, the problem and what are your initial
            suggestions or pre-requisites. You should provide as much information as needed so that
            whoever reads this request can get a straightfoward idea of how we can build a custom
            solution for you. Remember that everything you write here will be public and visible to
            everyone.
          </Typography>
          <TextField
            value={description.value}
            onChange={description.onChange}
            inputRef={description.ref}
            onBlur={description.onBlur}
            placeholder='Explain your problem and ideas...'
            multiline
            fullWidth
            minRows={7}
            variant='outlined'
            sx={{
              backgroundColor: 'white',
              overflow: 'hidden',
              borderRadius: '8px',
              margin: '0px 16px',
              maxWidth: '850px',
            }}
          />
        </div>
        <div className='w-full'>
          <Typography width={'100%'} fontWeight={700}>
            3. Add keywords (categories) that best suit your request
          </Typography>
          <Typography width={'100%'} fontWeight={400} fontSize={14} padding={'5px 20px'}>
            Add at least two or three keywords that best fit your request/project. It will make it
            easier for developers to understand what your need and find your request faster. Some
            developers like to focus on certain categories. Add up to 6 keywords.
          </Typography>

          <div className='mt-3 w-full mx-4'>
            {keywords.map((keyword) => (
              <Keyword
                key={keyword}
                currentKeyword={keyword}
                keywords={keywords}
                setValue={setValue}
              />
            ))}
          </div>

          <div className='flex flex-wrap items-center w-full gap-3 my-3 mx-4'>
            <Autocomplete
              disablePortal
              options={defaultKeywordsList}
              sx={{ width: '100%', maxWidth: '250px' }}
              renderInput={(params) => <TextField {...params} label='Keyword' />}
            />
            <TextField
              className='w-full max-w-[250px]'
              variant='outlined'
              placeholder='Type a keyword...'
              value={newKeyword}
              onChange={handleNewKeywordChanged}
              onKeyDown={keyDownHandler}
            />
            <StyledMuiButton className='primary'>Add</StyledMuiButton>
          </div>
        </div>

        <div className='w-full'>
          <Typography width={'100%'} fontWeight={700}>
            5. Do you have or need the data and/or database for this project?
          </Typography>
          <Typography width={'100%'} fontWeight={400} fontSize={14} padding={'5px 20px'}>
            This will clarify if the developers can pick and use a database right up or if they need
            to develop one from scratch for your project. This can and should impact the budget and
            time/date target.
          </Typography>
          <div className='w-full my-3 mx-4'>
            <FormControl>
              <RadioGroup
                aria-labelledby='demo-row-radio-buttons-group-label'
                name='row-radio-buttons-group'
              >
                <FormControlLabel
                  value='yes'
                  control={<Radio />}
                  label='Yes, I have all the required data or database and we can use it right away.'
                />
                <FormControlLabel
                  value='no-will-create-myself'
                  control={<Radio />}
                  label='No, but I will create one myself and then provide it to the developers.'
                />
                <FormControlLabel
                  value='no-but-find-on-web'
                  control={<Radio />}
                  label='No, but we can find the required data or database on the web.'
                />
                <FormControlLabel
                  value='no-devs-create-from-scratch'
                  control={<Radio />}
                  label='No, I need the developers to create the necessary database from scratch.'
                />
              </RadioGroup>
            </FormControl>
          </div>
        </div>

        <div className='w-full'>
          <Typography width={'100%'} fontWeight={700}>
            6. Do you have or need an app or website to integrate with this project?
          </Typography>
          <Typography width={'100%'} fontWeight={400} fontSize={14} padding={'5px 20px'}>
            If your project needs it, tell us if you already have an app or website that you want
            this project to be integrated into, or if developers need to create one for you. This
            can and should impact the budget and time/date target.
          </Typography>
          <div className='w-full my-3 mx-4'>
            <FormControl>
              <RadioGroup
                aria-labelledby='demo-row-radio-buttons-group-label'
                name='row-radio-buttons-group'
              >
                <FormControlLabel
                  value='yes'
                  control={<Radio />}
                  label='Yes, I already have an app or website that I can integrate with this project.'
                />
                <FormControlLabel
                  value='no-need-create-e2e'
                  control={<Radio />}
                  label='No, I need the developers to create and end-to-end solution for this project.'
                />
                <FormControlLabel
                  value='no-but-find-on-web'
                  control={<Radio />}
                  label="No, this project doesn't need any app or website."
                />
              </RadioGroup>
            </FormControl>
          </div>
        </div>

        <div className='w-full'>
          <Typography width={'100%'} fontWeight={700}>
            7. What is your expected budget for this project?
          </Typography>
          <Typography width={'100%'} fontWeight={400} fontSize={14} padding={'5px 20px'}>
            Providing an expected budget for your project will attract more developers, as they see
            this budget as their reward for successfuly completing your project. You can always talk
            and debate this budget with the developers.
          </Typography>
          <div className='w-full my-3 mx-4'>
            <NumericFormat
              customInput={TextField}
              thousandSeparator
              prefix='US$ '
              placeholder='Type a value (US$)'
            ></NumericFormat>
          </div>
        </div>

        <div className='w-full'>
          <Typography width={'100%'} fontWeight={700}>
            8. What will be your prefered payment plan to the developers?
          </Typography>
          <Typography width={'100%'} fontWeight={400} fontSize={14} padding={'5px 20px'}>
            Paying a defined portion of your total budget for each successful partial feature
            delivery by the developers will make it feel safer for both sides to invest in your
            project. You get deliveries in a timely manner, and the developers, their payment
            portions.
          </Typography>
          <div className='w-full my-3 mx-4'>
            <FormControl fullWidth>
              <TextField label='Paymment Plan' className='w-full max-w-[265px]' required select>
                <MenuItem value={1}>Daily deliveries and payments</MenuItem>
                <MenuItem value={2}>Weekly deliveries and payments</MenuItem>
                <MenuItem value={3}>Monthly deliveries and payments</MenuItem>
                <MenuItem value={4}>Yearly deliveries and payments</MenuItem>
                <MenuItem value={5}>All at once, right at the start</MenuItem>
                <MenuItem value={6}>All at once, when project ends</MenuItem>
              </TextField>
            </FormControl>
          </div>
        </div>

        <div className='w-full'>
          <Typography width={'100%'} fontWeight={700}>
            9. What is your initial date target for this project?
          </Typography>
          <Typography width={'100%'} fontWeight={400} fontSize={14} padding={'5px 20px'}>
            Tell us when you would most likely want the final portion of this project to be
            delivered. Take in consideration the effort needed to achieve your needs for this
            project. This is only a theoretical target, and can always be further discussed with the
            developers.
          </Typography>
          <div className='w-full my-3 flex items-center flex-wrap gap-3 mx-4'>
            <div className='flex-grow-0 items-center gap-3'>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateField label='Date target' className='w-full max-w-[265px]' />
              </LocalizationProvider>
            </div>
            <div className='flex-grow-0 mr-1'>or</div>
            <div className='flex-auto flex items-center gap-3'>
              <NumericFormat
                className='w-full max-w-[100px]'
                customInput={TextField}
                thousandSeparator
                placeholder='00'
              ></NumericFormat>
              <TextField label='Type' className='w-full max-w-[150px]' required select>
                <MenuItem value={1}>Day(s)</MenuItem>
                <MenuItem value={2}>Week(s)</MenuItem>
                <MenuItem value={3}>Month(s)</MenuItem>
                <MenuItem value={4}>Year(s)</MenuItem>
              </TextField>
            </div>
          </div>
        </div>

        <div className='w-full flex justify-end gap-2 flex-wrap mb-20'>
          <StyledMuiButton onClick={handleBack} className='secondary'>
            <Close />
            Cancel
          </StyledMuiButton>
          <StyledMuiButton
            onClick={handleSubmit(handleClick)}
            className='plausible-event-name=Submit+Request+Click primary'
            disabled={!formState.isDirty || !formState.isValid || formState.isSubmitted}
          >
            <CheckRoundedIcon />
            Submit Request
          </StyledMuiButton>
        </div>
      </div>
    </div>
  );
};

export default RequestSolution;
