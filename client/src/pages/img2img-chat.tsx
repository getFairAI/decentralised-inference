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

import {
  FormControl,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  useTheme,
} from '@mui/material';
import { ChangeEvent, DragEvent, useCallback, useMemo, useState } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import { printSize } from '@/utils/common';
import { motion } from 'framer-motion';
import DebounceIconButton from '@/components/debounce-icon-button';
import SendIcon from '@mui/icons-material/Send';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { enqueueSnackbar } from 'notistack';
import { MAX_IMG2IMG_UPLOAD_SIZE } from '@/constants';

const SketchCanvasZone = ({ backgroundImage }: { backgroundImage: File }) => {
  return (
    <ReactSketchCanvas
      width='100%'
      height='100%'
      canvasColor='transparent'
      strokeColor='#ff00ff'
      strokeWidth={15}
      backgroundImage={URL.createObjectURL(backgroundImage)}
      exportWithBackgroundImage={true}
      style={{
        border: 'none !important',
      }}
    />
  );
};

const FileInputDropZone = () => {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [hasFileDrag, setHasFileDrag] = useState(false);
  const theme = useTheme();
  const [isSending, setIsSending] = useState(false);

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHasFileDrag(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHasFileDrag(false);
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHasFileDrag(true);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setHasFileDrag(false);
    // field.onChange(event.dataTransfer.files[0]);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      setFile(file);
    } else {
      setFile(undefined);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      if (
        (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') ||
        file.size > MAX_IMG2IMG_UPLOAD_SIZE
      ) {
        enqueueSnackbar(
          'The file or image you selected has an unexpected type or is too big. Please select a JPG, JPEG or PNG image with a maximum of ' +
            (MAX_IMG2IMG_UPLOAD_SIZE / 1024 / 1000).toFixed(2) +
            ' MB',
          {
            variant: 'error',
            style: { fontWeight: 700 },
            autoHideDuration: 5000,
          },
        );
        setFile(undefined);
      } else {
        setFile(file);
      }
    } else {
      setFile(undefined);
    }
  };

  const handleRemoveFile = () => {
    setFile(undefined);
  };

  const sendDisabled = useMemo(() => {
    if (isSending || !file) {
      return true;
    }
  }, [file, isSending]);

  const handleSendClick = useCallback(async () => {
    if (isSending) {
      return;
    } else {
      // continue
    }
    setIsSending(true);

    // if (file) {
    //   // handle send file
    //   await handleSendFile();
    // } else {
    //   await handleSendText();
    // }

    setIsSending(false);
  }, [file, isSending]);

  if (file) {
    return (
      <div className='w-full flex flex-col gap-2'>
        <p className='font-medium text-lg mt-5 text-center mb-4 px-5'>
          This is your starter image. Using your mouse or finger, paint on top of what you want to
          modify, and/or write your prompt bellow.
        </p>
        <motion.div
          initial={{ opacity: 0, y: '-20px' }}
          animate={{ opacity: 1, y: 0 }}
          className='w-full rounded-lg border-gray-700 border-2 overflow-hidden'
        >
          <div className='w-full h-full absolute z-50'>
            <SketchCanvasZone backgroundImage={file} />
          </div>
          {/* The img bellow is only used to set the container size of the sketch zone absolute */}
          <img src={URL.createObjectURL(file)} className='w-full object-contain z-0'></img>
        </motion.div>
        <FormControl variant='outlined' fullWidth>
          <TextField
            multiline
            minRows={1}
            value={file?.name}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <IconButton aria-label='Remove' onClick={handleRemoveFile}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position='start'>{printSize(file)}</InputAdornment>,
              sx: {
                borderWidth: '1px',
                borderColor: theme.palette.text.primary,
              },
              readOnly: true,
            }}
          />
        </FormControl>

        <TextField
          multiline
          minRows={1}
          maxRows={3}
          sx={{
            background: '#fff',
            borderRadius: '10px',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '20px',
            lineHeight: '16px',
            width: '100%',
            margin: '20px 0px 0px 0px',
          }}
          InputProps={{
            endAdornment: (
              <>
                <DebounceIconButton
                  onClick={handleSendClick}
                  sx={{
                    color: '#3aaaaa',
                  }}
                  disabled={sendDisabled}
                  className='plausible-event-name=Send+Text+Click'
                >
                  <Tooltip title={'Submit'}>
                    <SendIcon />
                  </Tooltip>
                </DebounceIconButton>
              </>
            ),
          }}
          placeholder='Describe what you want to generate here'
        ></TextField>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: '-20px' }} animate={{ opacity: 1, y: 0 }}>
      <p className='font-medium text-lg mt-5 text-center'>First, add your current image bellow.</p>
      <FormControl variant='outlined' fullWidth margin='normal'>
        <TextField
          multiline
          minRows={1}
          value={'Drop your image file here or click to choose'}
          inputProps={{
            style: { textAlign: 'center', cursor: 'pointer' },
          }}
          InputProps={{
            readOnly: true,
            sx: {
              background: theme.palette.background.default,
              transform: hasFileDrag ? 'scale(1.02)' : 'scale(1)',
              filter: hasFileDrag
                ? `blur(2px)  ${
                    theme.palette.mode === 'dark' ? 'contrast(0.65)' : 'brightness(0.9)'
                  }`
                : theme.palette.mode === 'dark'
                ? 'contrast(0.65)'
                : 'brightness(0.9)',
              backdropFilter: 'blur(2px)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: hasFileDrag
                  ? theme.palette.text.primary
                  : theme.palette.text.secondary,
              },
            },
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() =>
            (document.querySelector('input[name=imageFileDropped]') as HTMLButtonElement)?.click()
          }
        />
      </FormControl>
      <input
        type='file'
        hidden
        name={'imageFileDropped'}
        accept='image/png, image/jpeg, image/jpg'
        value={file}
        onChange={onFileChange}
      />
    </motion.div>
  );
};

export default function Img2ImgChat() {
  return (
    <>
      <div className='flex flex-col items-center justify-center w-full mt-10 px-4 pb-40'>
        <div className='text-3xl font-semibold mb-5'>Image To Image Generation</div>

        <div className='w-full max-w-[600px]'>
          <FileInputDropZone />
        </div>
      </div>
    </>
  );
}
