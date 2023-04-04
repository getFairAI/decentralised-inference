import MDEditor from '@uiw/react-md-editor';
import { useController, UseControllerProps } from 'react-hook-form';
import rehypeSanitize from 'rehype-sanitize';
import '@/styles/md-editor.css';

const MarkdownControl = (props: UseControllerProps) => {
  const { field } = useController(props);

  return (
    <MDEditor
      value={field.value}
      onChange={field.onChange}
      previewOptions={{
        rehypePlugins: [[rehypeSanitize]],
      }}
    />
  );
};

export default MarkdownControl;
