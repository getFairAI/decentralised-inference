import { QUERY_OPERATOR_RESULTS_RESPONSES, QUERY_REGISTERED_OPERATORS } from '@/queries/graphql';
import { render, screen } from '@testing-library/react';
import { MockedProvider, mockObservableLink } from '@apollo/client/testing';
import Detail from '@/pages/model/detail';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { DEFAULT_TAGS, REGISTER_OPERATION_TAG } from '@/constants';
import { SnackbarProvider } from 'notistack';

const queryRegisteredOperatorsMock = [
  {
    request: {
      query: QUERY_REGISTERED_OPERATORS,
      variables: {
        tags: [
          ...DEFAULT_TAGS,
          REGISTER_OPERATION_TAG,
          {
            name: 'Model-Creator',
            values: ['creator 1'],
          },
          {
            name: 'Model-Name',
            values: ['model 1'],
          },
        ],
      },
    },
    result: {
      data: {
        transactions: {
          edges: [
            {
              cursor: 'cursor',
              node: {
                id: 'tx1',
                signature: 'signature',
                owner: { address: 'operator 1', key: 'key' },
                recipient: 'tx2',
                fee: { winston: '0', ar: '0' },
                quantity: { winston: '0', ar: '0' },
                block: { timestamp: Date.now(), previous: 0, height: 0, id: 'blockId' },
                bundledIn: { id: 'bundledInId' },
                data: { size: '0', type: 'type' },
                tags: [
                  { name: 'App-Name', value: 'FairProtocol' },
                  { name: 'Operation-Name', value: 'Operator Registration' },
                  { name: 'Model-Fee', value: '1000000' },
                  { name: 'Model-Creator', value: 'creator 1' },
                  { name: 'Model-Name', value: 'model 1' },
                ],
              },
            },
          ],
        },
      },
    },
  },
  {
    request: {
      query: QUERY_OPERATOR_RESULTS_RESPONSES,
      variables: {
        owners: ['operator 1'],
        tagsRequests: [
          ...DEFAULT_TAGS,
          { name: 'Model-Fee', values: ['1000000'] },
          { name: 'Model-Creator', values: ['creator 1'] },
          { name: 'Model-Name', values: ['model 1'] },
          { name: 'Operation-Name', values: ['Inference Payment'] },
          { name: 'Model-Fee', values: ['1000000'] },
        ],
        tagsResuts: [
          ...DEFAULT_TAGS,
          { name: 'Model-Fee', values: ['1000000'] },
          { name: 'Model-Creator', values: ['creator 1'] },
          { name: 'Model-Name', values: ['model 1'] },
          { name: 'Operation-Name', values: ['Model Inference Response'] },
          { name: 'Model-Fee', values: ['1000000'] },
        ],
      },
    },
    result: {
      data: {
        requests: {
          edges: [
            {
              node: {
                owner: {
                  address: 'user 1',
                },
                recipient: 'operator 1',
              },
            },
          ],
        },
        results: {
          edges: [
            {
              node: {
                owner: {
                  address: 'operator 1',
                },
              },
            },
          ],
        },
      },
    },
  },
];

const mockState = {
  node: {
    owner: {
      address: 'creator 1',
    },
    tags: [
      {
        name: 'Model-Name',
        value: 'model 1',
      },
      {
        name: 'Description',
        value: 'description',
      },
      {
        name: 'Category',
        value: 'text',
      },
      {
        name: 'AvatarUrl',
        value: 'avatarLink',
      },
    ],
  },
};

const mockLink = mockObservableLink();

const fakeLoader = () => 'fakeData';

describe('pages/model/detail.tsx', () => {
  it('should populate model data from queries', async () => {
    const mockRouter = createMemoryRouter([
      {
        path: '/model/:txid',
        children: [
          { path: 'detail', element: <Detail /> }
        ],
        loader: fakeLoader
      }
    ], {
      initialEntries: [{ pathname: '/model/tx1/detail', state: mockState }],
    });
    render(
      <MockedProvider mocks={queryRegisteredOperatorsMock} link={mockLink}>
        <SnackbarProvider>
          <RouterProvider router={mockRouter} />
        </SnackbarProvider>
      </MockedProvider>,
    );

    const nameField = (await screen.findByLabelText('Name')) as HTMLInputElement;
    expect(nameField.value).toEqual('model 1');
    const descriptionField = (await screen.findByLabelText('Description')) as HTMLInputElement;
    expect(descriptionField.value).toEqual('description');

    expect(screen.getByRole('table')).toBeDefined();
  });
});
