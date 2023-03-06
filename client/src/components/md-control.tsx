import MDEditor from '@uiw/react-md-editor';
import { useController, UseControllerProps } from 'react-hook-form';
import rehypeSanitize from 'rehype-sanitize';

const MarkdownControl = (props: UseControllerProps) => {
  const { field } = useController(props);

  return (
    <MDEditor
      style={{ marginBottom: '8px' }}
      value={field.value}
      onChange={field.onChange}
      previewOptions={{
        rehypePlugins: [[rehypeSanitize]],
      }}
    />
  );
};

export default MarkdownControl;
