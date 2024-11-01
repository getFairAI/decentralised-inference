import { StyledMuiButton } from '@/styles/components';
import { ArrowForwardIosRounded, PlayArrowRounded } from '@mui/icons-material';
import { Backdrop, useTheme } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const LtippRetrospectiveOnboarding = (
  { isOnboardingPopupOpen, handleSetOnboardingPopupState }: { isOnboardingPopupOpen: boolean, handleSetOnboardingPopupState: () => void }
) => {

  const theme = useTheme();

  return (
    <>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 5,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}
        open={isOnboardingPopupOpen}
      >
        <div className='w-full max-w-[1200px] relative animate-slide-down bg-white p-6 rounded-xl max-h-[90vh] mt-[70px] overflow-y-auto'>
          <StyledMuiButton
            className='secondary fully-rounded absolute top-[10px] right-[10px]'
            onClick={handleSetOnboardingPopupState}
          >
            <CloseRoundedIcon />
          </StyledMuiButton>

          <div className='w-full flex flex-col gap-2 text-gray-700'>
            <h1 className='flex gap-3 items-center'>
              <img src='./fair-protocol-face-primarycolor.png' className='w-[40px]' />
              <span>Welcome to Arbitrum Collabtech DECIDE: LTIPP Retrospective</span>
            </h1>

            <div className='flex flex-col gap-4 mt-4 items-center'>
              <div className='w-full rounded-xl bg-gray-100 flex justify-center flex-wrap'>
                <div className='p-4 flex-1'>
                  <h3 className='flex items-center gap-2'>
                    <ArrowForwardIosRounded
                      className='primary-text-color'
                      sx={{ width: '18px' }}
                    />
                    Generate new reports
                  </h3>
                  <h4>
                    Generate a meaningful and instant retrospective analysis of the lastest LTIPP
                    programs, anytime.
                  </h4>
                </div>

                <img
                  src='./onboarding-solutions/reports/example-report2.png'
                  className='m-3 flex-1 rounded-xl border-white border-4 shadow-lg'
                  style={{ width: '100%', maxWidth: '500px' }}
                />
              </div>

              <div className='w-full flex justify-center flex-wrap'>
                <div className='p-4 flex-1'>
                  <h3 className='flex items-center gap-2'>
                    <ArrowForwardIosRounded
                      className='primary-text-color'
                      sx={{ width: '18px' }}
                    />
                    Manage reports
                  </h3>
                  <h4>
                    Generate a new report at different dates and keep them separated by their time
                    and date of generation.
                  </h4>
                </div>

                <img
                  src='./onboarding-solutions/reports/reports-list.png'
                  className='m-3 flex-1 rounded-xl border-white border-4 shadow-lg'
                  style={{ width: '100%', maxWidth: '300px' }}
                />
              </div>

              <div className='w-full rounded-xl bg-gray-100 flex justify-center flex-wrap'>
                <div className='p-4 flex-1'>
                  <h3 className='flex items-center gap-2'>
                    <ArrowForwardIosRounded
                      className='primary-text-color'
                      sx={{ width: '18px' }}
                    />
                    Compare reports
                  </h3>
                  <h4>Access all your generated reports and compare data between them.</h4>
                </div>

                <img
                  src='./onboarding-solutions/reports/compare-data.png'
                  className='m-3 flex-1 rounded-xl border-white border-4 shadow-lg'
                  style={{ width: '100%', maxWidth: '500px' }}
                />
              </div>

              <div className='w-full flex justify-center flex-wrap'>
                <div className='p-4 flex-1'>
                  <h3 className='flex items-center gap-2'>
                    <ArrowForwardIosRounded
                      className='primary-text-color'
                      sx={{ width: '18px' }}
                    />
                    Research reports
                  </h3>
                  <h4>
                    Talk to an AI chatbot about to know more about each report, independently.
                  </h4>
                </div>

                <img
                  src='./onboarding-solutions/reports/ask-questions.png'
                  className='m-3 flex-1 rounded-xl border-white border-4 shadow-lg'
                  style={{ width: '100%', maxWidth: '500px' }}
                />
              </div>
            </div>

            <div className='flex justify-center w-full mt-3'>
              <StyledMuiButton
                className='primary gradient-bg'
                onClick={handleSetOnboardingPopupState}
              >
                <PlayArrowRounded />
                Start using this solution
              </StyledMuiButton>
            </div>
          </div>
        </div>
      </Backdrop>
    </>
  );
};

export default LtippRetrospectiveOnboarding;