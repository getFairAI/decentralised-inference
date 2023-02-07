import { gql, useQuery } from '@apollo/client';

export default function Home() {
  const QUERY = gql`
    query Models {
      models {
        name
        description
        category
        creator
      }
    }
  `;

  const { data, loading, error } = useQuery(QUERY);
  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const models = data.models.slice(0, 4);

  return (
    <div>
      {models.map((model: any) => (
        <div key={model.name}>
          <p>
            { model.name }
          </p>
          <p>{ model.description }</p>
          <p>{ model.category }</p>
          <p>{ model.creator }</p>
        </div>
      ))}
    </div>
  );
}
