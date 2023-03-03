import { CustomStepper } from "@/components/stepper";
import { useQuery } from "@apollo/client";
import { Container, Box, Stepper, Stack, Card, CardActionArea, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Operators = () => {
  const navigate = useNavigate();
  const mockData = [
    {
      txid: 'gOtMgHjoxsllyVs5Mbqb-ICYljxqnavAptADJnNmnaM',
      name: 'model X',
      uploader: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M',
      nOperators: 8,
      avgFee: 0.4,
      avgRunCost: 0.1,
      totalRuns: 198,
      rating: 18
    }
  ]
  
  const handleCardClick = (idx: number) => {
    navigate(`/model/${encodeURIComponent(mockData[idx].txid)}/register`);
  }
  return (
    <>
    <Container sx={{ top: '64px', position: 'relative' }}>
      <Box>
        <Stack spacing={4} sx={{ margin: '16px' }}>
          {mockData.map((el, idx) => (
            <Card key={idx}>
              <Box>
                <CardActionArea onClick={(e) => handleCardClick(idx)}>
                  <Typography>Name: {el.name}</Typography>
                  <Typography>Transaction id: {el.txid}</Typography>
                  <Typography>Creator: {el.uploader}</Typography>
                  <Typography>Average Fee: {el.avgFee}</Typography>
                  <Typography>Average Run cost: {el.avgRunCost}</Typography>
                  <Typography>Number of Executions to date: {el.totalRuns}</Typography>
                  <Typography>Rating: {el.rating}</Typography>
                </CardActionArea>
              </Box>
            </Card>
          ))}
        </Stack>
        {/* <CustomStepper /> */}
      </Box>
    </Container>
    </>
  );
};

export default Operators;