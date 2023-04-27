import MDEditor, { MDEditorProps } from '@uiw/react-md-editor';
import { useController, UseControllerProps } from 'react-hook-form';
import rehypeSanitize from 'rehype-sanitize';
import { styled } from '@mui/material/styles';
import { FormControl, FormHelperText } from '@mui/material';

const StyledEditor = styled(MDEditor, {
  shouldForwardProp: prop => prop !== 'invalid',
})<{ invalid: boolean }>(({ theme, invalid }) => ({
  marginBottom: '8px',
  borderRadius: '23px',
  border: 'none',
  boxShadow: 'none',
  ...(invalid && {
    border: `1px solid ${theme.palette.error.main}`,
    color: theme.palette.error.main,
  }),
  background:
    theme.palette.mode === 'dark' ? 'rgba(61, 61, 61, 0.98)' : theme.palette.secondary.main,
  '.w-md-editor-toolbar': {
    background: `linear-gradient(180deg, transparent 0%, ${theme.palette.primary.main} 100%)`,
    borderRadius: '43px',
    ...(invalid && { borderTop: theme.palette.error.main }),
  },
  '.wmde-markdown': {
    background: 'transparent',
  },
  '.w-md-editor-bar': {
    right: '10px',
    bottom: '4px',
  },
}));

const MarkdownControl = ({
  props,
  viewProps,
}: {
  props?: UseControllerProps;
  viewProps?: MDEditorProps;
}) => {
  if (props) {
    const { field, fieldState } = useController(props);

    const showError = () => {
      if (fieldState.invalid) {
        return <FormHelperText>This Field is Required</FormHelperText>;
      }
    };

    return (
      <FormControl fullWidth margin='normal' error={fieldState.invalid}>
        <StyledEditor
          value={field.value}
          onChange={field.onChange}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize]],
          }}
          invalid={fieldState.invalid}
        />
        {showError()}
      </FormControl>
    );
  } else {
    return (
      <FormControl fullWidth margin='normal'>
        <StyledEditor {...viewProps} invalid={false} />
      </FormControl>
    );
  }
};

export default MarkdownControl;
