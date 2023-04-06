import MDEditor, { MDEditorProps } from '@uiw/react-md-editor';
import { useController, UseControllerProps } from 'react-hook-form';
import rehypeSanitize from 'rehype-sanitize';
import { styled } from '@mui/system';

const StyledEditor = styled(MDEditor)(({ theme }) => ({
  marginBottom: '8px',
  borderRadius: '23px',
  border: 'none',
  boxShadow: 'none',
  
  background: theme.palette.mode === 'dark' ? 'rgba(61, 61, 61, 0.98)' : theme.palette.secondary.main,
  '.w-md-editor-toolbar': {
    background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    borderRadius: '43px',
  },
  '.wmde-markdown': {
    background: 'transparent',
  },
  '.w-md-editor-bar': {
    right: '10px',
    bottom: '4px',
  } 
}));

const MarkdownControl = ({ props, viewProps}: {props?: UseControllerProps, viewProps?: MDEditorProps}) => {
  if (props) {
    const { field } = useController(props);

    return (
      <StyledEditor
        value={field.value}
        onChange={field.onChange}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
      />
    );
  } else {
    return (
      <StyledEditor
        { ...viewProps}
      />
    );
  }
  
};

export default MarkdownControl;
