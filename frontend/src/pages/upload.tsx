import FileUpload from "@/components/file-upload";
import { Avatar, Button, Card, CardActions, CardContent, CardHeader, Container, FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Skeleton, TextField, Typography } from "@mui/material";
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
  const [ category, setCategory ] = useState('');
  const [ usageNotes, setUsageNotes ] = useState('');
  const [ description, setDescription ] = useState('');
  /* const [ value, setValue ] = useState(''); */

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  }

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
  }

  const handleUsageNotesChange = (value: string | undefined) => {
    if (value) setUsageNotes(value);
  }
  
  return (
    <Container>
      <Card>
        <CardHeader>
          <Typography variant="h5" gutterBottom>Create Your Model</Typography>
        </CardHeader>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            General Information
          </Typography>
          <table style={ { width: "100%"}}>
            <tbody>
              <tr>
                <td colSpan={2} rowSpan={1} style={{ display: 'flex', justifyContent: 'center' }}>
                  <Skeleton variant="circular" animation={false}>
                    <Avatar sx={{ width: 90, height: 90 }}/>
                  </Skeleton>
                </td>
                <td colSpan={8} rowSpan={2}>
                  <TextField label="Name" variant="outlined" value={name} onChange={handleNameChange} style={{ width: '100%' }}/>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={category}
                      label="Category"
                      onChange={handleCategoryChange}
                    >
                      <MenuItem value={'text'}>Text</MenuItem>
                      <MenuItem value={'audio'}>Audio</MenuItem>
                      <MenuItem value={'video'}>Video</MenuItem>
                    </Select>
                  </FormControl>
                </td>
              </tr>
              <tr>
                <td colSpan={2} rowSpan={1} style={{ display: 'flex', justifyContent: 'center' }}>
                  <Button>Upload</Button>
                </td>
              </tr>
              <tr>
                <td colSpan={10}>
                  <TextField
                    label="Description"
                    variant="outlined"
                    multiline
                    value={description}
                    onChange={handleDescriptionChange}
                    style={{ width: '100%' }}
                    margin="normal"
                    minRows={2}
                    maxRows={3}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <Typography variant="h6" gutterBottom>Usage Notes: </Typography>
          <MDEditor
            value={usageNotes}
            onChange={handleUsageNotesChange}
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
          <Typography variant="h6" marginTop={'8px'}>Files</Typography>
          <FileUpload name={name} description={description}></FileUpload>
        </CardContent>
      <CardActions>
        <Button>Submit</Button>
      </CardActions>
      </Card>
    </Container>
  )
};

export default Upload;