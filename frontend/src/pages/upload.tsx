import FileUpload from "@/components/file-upload";
import { Button, Card, Container, Paper, TextField } from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);
const Upload = () => {
  const [ name, setName ] = useState('');
  const [ description, setDescription ] = useState('');
  /* const [ value, setValue ] = useState(''); */

  const handleNameChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setName(event.target.value);
  }
  
  return (
    <Container>
      <Card>
      <TextField id="outlined-basic" label="Name" variant="outlined" value={name} onChange={handleNameChange}/>
        {/* <Button>
          Upload
          <input type="file" hidden></input>
        </Button> */}
        <MDEditor
          value={description}
          onChange={(value, event) => setDescription(value!)}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize]],
          }}
          /* renderTextarea={(props, { dispatch, onChange }) => {
            return (
              <TextField {...props} variant="outlined" onChange={(e) => {
                dispatch && dispatch({ markdown: e.target.value });
                onChange && onChange(e.target.value);
              }}/>
            )
          }} */
        />
        <FileUpload name={name} description={description}></FileUpload>
      </Card>
    </Container>
  )
};

export default Upload;