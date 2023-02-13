import { Dialog, Slide } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { forwardRef, ReactElement, Ref } from "react";
import rehypeSanitize from "rehype-sanitize";
import MDEditor from '@uiw/react-md-editor';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const DialogPreview = ({ open }: { open: boolean}) => {
  /* const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
 */
  return (
    <div>
      <Dialog
        fullScreen
        open={open}
        /* onClose={handleClose} */
        TransitionComponent={Transition}
      >
        <MDEditor
          style={{ marginBottom: '8px' }}
          value={''}
          preview={'preview'}
          /* fullscreen={true} */
          previewOptions={{
            rehypePlugins: [[rehypeSanitize]],
          }}
        />
      </Dialog>
    </div>
  );
}

export default DialogPreview;