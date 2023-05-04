import { render, screen } from '@testing-library/react';
import BasicTable from '@/components/basic-table';
import { BrowserRouter } from 'react-router-dom';
import { IEdge } from '@/interfaces/arweave';
import { ApolloError } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';

const mocks: IEdge[] = [
  {
    cursor: 'cursor1',
    node: {
      id: 'txid',
      owner: {
        address: 'mock 1 address',
        key: 'key',
      },
      quantity: {
        ar: '0',
        winston: '0',
      },
      block: {
        timestamp: 2,
        height: 1,
        id: 'id',
        previous: 'prvious',
      },
      tags: [
        {
          name: 'Operator-Fee',
          value: '100000000',
        },
        {
          name: 'model-Name',
          value: 'testModel1',
        },
        {
          name: 'Model-Creator',
          value: 'testCreator1',
        },
        {
          name: 'Model-Transaction',
          value: 'testModel1tx',
        },
      ],
      recipient: '',
      fee: {
        ar: '',
        winston: '',
      },
      data: {
        size: 0,
        type: '',
      },
      signature: 'signature',
    },
  },
  {
    cursor: 'cursor1',
    node: {
      id: 'txid2',
      owner: {
        address: 'mock 1 address',
        key: 'key',
      },
      quantity: {
        ar: '0',
        winston: '0',
      },
      block: {
        timestamp: 3,
        height: 2,
        id: 'id',
        previous: 'prvious',
      },
      tags: [
        {
          name: 'Operator-Fee',
          value: '200000000',
        },
        {
          name: 'model-Name',
          value: 'testModel1',
        },
        {
          name: 'Model-Creator',
          value: 'testCreator1',
        },
        {
          name: 'Model-Transaction',
          value: 'testModel1tx',
        },
      ],
      recipient: '',
      fee: {
        ar: '',
        winston: '',
      },
      data: {
        size: 0,
        type: '',
      },
      signature: 'signature',
    },
  },
];

const mockState = {
  cursor: 'cursor1',
  node: {
    id: 'testModel1tx',
    owner: {
      address: 'testCreator1',
      key: 'key',
    },
    quantity: {
      ar: '0',
      winston: '0',
    },
    block: {
      timestamp: 2,
      height: 1,
      id: 'id',
      previous: 'prvious',
    },
    tags: [
      {
        name: 'Model-Fee',
        value: '100000000',
      },
      {
        name: 'model-Name',
        value: 'testModel1',
      },
      {
        name: 'Model-Creator',
        value: 'testCreator1',
      },
    ],
    recipient: '',
    fee: {
      ar: '',
      winston: '',
    },
    data: {
      size: 0,
      type: '',
    },
    signature: 'signature',
  },
};

const fakeRetry = () => {
  return;
};

const fakeFetchMore = async () => {
  return {
    data: undefined,
    loading: false,
    networkStatus: 1,
  };
};

const mockError: ApolloError = {
  name: '',
  message: '',
  clientErrors: [],
  graphQLErrors: [],
  networkError: null,
  extraInfo: null,
  protocolErrors: [
    {
      message: '',
    },
  ],
};

const mockIntersectionObserver = class {
  constructor() {
    return;
  }
  observe() {
    return;
  }
  unobserve() {
    return;
  }
  disconnect() {
    return;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockHandleSelected = (index: number) => {
  return;
};

describe('components/basic-table.tsx', () => {
  beforeEach(async () => {
    (window.IntersectionObserver as unknown) = mockIntersectionObserver;
  });
  it('should display data', () => {
    render(
      <MockedProvider>
        <BasicTable
          type='operators'
          data={mocks}
          loading={false}
          retry={fakeRetry}
          fetchMore={fakeFetchMore}
          state={mockState}
          hasNextPage={false}
          selectedIdx={0}
          handleSelected={mockHandleSelected}
        />
      </MockedProvider>,
      {
        wrapper: BrowserRouter,
      },
    );

    const allRows = screen.getAllByRole('row');
    expect(allRows.length).toEqual(mocks.length + 1); // 2 data rows + 1 header row
  });

  it('should display loading', () => {
    render(
      <BasicTable
        type='operators'
        data={[]}
        loading={true}
        retry={fakeRetry}
        fetchMore={fakeFetchMore}
        state={mockState}
        hasNextPage={false}
        selectedIdx={0}
        handleSelected={mockHandleSelected}
      />,
      {
        wrapper: BrowserRouter,
      },
    );

    const loadingRows = 5;

    const allRows = screen.getAllByTestId('loading-skeleton');
    expect(allRows.length).toEqual(loadingRows);
    // expect loading message in row
  });

  it('should display operators error', () => {
    render(
      <BasicTable
        type='operators'
        data={mocks}
        loading={false}
        retry={fakeRetry}
        fetchMore={fakeFetchMore}
        state={mockState}
        hasNextPage={false}
        error={mockError}
        selectedIdx={0}
        handleSelected={mockHandleSelected}
      />,
      {
        wrapper: BrowserRouter,
      },
    );

    const errorElement = screen.getByTestId('table-error');
    expect(errorElement.textContent).toEqual(
      'Could not Fetch Registered Operators for this Model.Retry',
    );
  });

  it('should display scripts error', () => {
    render(
      <BasicTable
        type='scripts'
        data={mocks}
        loading={false}
        retry={fakeRetry}
        fetchMore={fakeFetchMore}
        state={mockState}
        hasNextPage={false}
        error={mockError}
        selectedIdx={0}
        handleSelected={mockHandleSelected}
      />,
      {
        wrapper: BrowserRouter,
      },
    );

    const errorElement = screen.getByTestId('table-error');
    expect(errorElement.textContent).toEqual('Could not Fetch Scripts for this Model.Retry');
  });

  it('should display message with no operators data', () => {
    render(
      <BasicTable
        type='operators'
        data={[]}
        loading={false}
        retry={fakeRetry}
        fetchMore={fakeFetchMore}
        state={mockState}
        hasNextPage={false}
        selectedIdx={0}
        handleSelected={mockHandleSelected}
      />,
      {
        wrapper: BrowserRouter,
      },
    );

    const errorElement = screen.getByTestId('table-empty');
    expect(errorElement.textContent).toEqual('Could not find available Operators.');
  });

  it('should display message with no scripts data', () => {
    render(
      <BasicTable
        type='scripts'
        data={[]}
        loading={false}
        retry={fakeRetry}
        fetchMore={fakeFetchMore}
        state={mockState}
        hasNextPage={false}
        selectedIdx={0}
        handleSelected={mockHandleSelected}
      />,
      {
        wrapper: BrowserRouter,
      },
    );

    const errorElement = screen.getByTestId('table-empty');
    expect(errorElement.textContent).toEqual('Could not find available Scripts');
  });
});
