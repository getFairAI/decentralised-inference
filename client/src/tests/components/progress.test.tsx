import {render, screen} from '@testing-library/react';
import CustomProgress from '@/components/progress';

describe('components/progress.tsx', () => {
  it('should display progress bar with percetage 10%', async () => {
    render(<CustomProgress value={10}/>);
    expect(await screen.queryByTestId('progress-bar-text')?.textContent).toEqual('10%');
  });

  it('should update value', async () => {
    // value = 40;
    const { rerender } = render(<CustomProgress value={10}/>);
    expect(await screen.queryByTestId('progress-bar-text')?.textContent).toEqual('10%');

    rerender(<CustomProgress value={60} />);
    expect(await screen.queryByTestId('progress-bar-text')?.textContent).toEqual('60%');
  });
});