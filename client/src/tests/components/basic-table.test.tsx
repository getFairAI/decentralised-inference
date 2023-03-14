import { render, screen } from '@testing-library/react';
import BasicTable, { RowData } from '@/components/basic-table';
import { BrowserRouter } from 'react-router-dom';

const date1 = Date.now() * 1000;
const date2 = Date.now() * 1000 + 3600;
const mocks: RowData[] = [
  {
    quantityAR: 0.1,
    address: 'mock 1 address',
    stamps: 9,
    fee: '100000000',
    registrationTimestamp: date1.toLocaleString(),
    availability: 100,
    modelName: 'testModel1',
    modelCreator: 'testCreator1',
    modelTransaction: 'testModel1tx',
  },
  {
    quantityAR: 0.05,
    address: 'mock 2 address',
    stamps: 903,
    fee: '200000000',
    registrationTimestamp: date2.toLocaleString(),
    availability: 89,
    modelName: 'testModel1',
    modelCreator: 'testCreator1',
    modelTransaction: 'testModel1tx',
  },
];

describe('components/basic-table.tsx', () => {
  it('should display data', () => {
    render(<BasicTable data={mocks} loading={false} />, { wrapper: BrowserRouter });

    const allRows = screen.getAllByRole('row');
    expect(allRows.length).toEqual(3); // 2 data rows + 1 header row
  });

  it.skip('should display loading', () => {
    render(<BasicTable data={mocks} loading={true} />, { wrapper: BrowserRouter });

    const allRows = screen.getAllByRole('row');
    expect(allRows.length).toEqual(1);
    // expect loading message in row
  });

  it.skip('should display error', () => {
    render(<BasicTable data={mocks} loading={true} />, { wrapper: BrowserRouter });

    const allRows = screen.getAllByRole('row');
    expect(allRows.length).toEqual(1);
    // expect error message in row
  });
});
