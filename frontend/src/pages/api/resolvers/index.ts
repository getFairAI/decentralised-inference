const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

const models = [
  {
    name: 'model #1',
    description: 'some description',
    category: 'text',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #2',
    description: 'some description',
    category: 'audio',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #3',
    description: 'some description',
    category: 'video',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #4',
    description: 'some description',
    category: 'text',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },{
    name: 'model #5',
    description: 'some description',
    category: 'video',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #6',
    description: 'some description',
    category: 'text',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #7',
    description: 'some description',
    category: 'text',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #8',
    description: 'some description',
    category: 'audio',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #9',
    description: 'some description',
    category: 'video',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #10',
    description: 'some description',
    category: 'text',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #11',
    description: 'some description',
    category: 'text',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #12',
    description: 'some description',
    category: 'text',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-GvyYprkjqafhtjeSx2M'
  },
  {
    name: 'model #13',
    description: 'some description',
    category: 'text',
    creator: 'rM9K69Uv7olZeKA0bOZ9dwo-AJXNjqafhtjeSx2M'
  }
];

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
export const resolvers = {
  Query: {
    models: () => models,
  },
};