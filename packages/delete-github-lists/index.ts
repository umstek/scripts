import { graphql } from '@octokit/graphql';

const token = process.env.GITHUB_SCRIPTS_ACCESS_TOKEN;
if (!token) {
  throw new Error(
    'Missing GITHUB_SCRIPTS_ACCESS_TOKEN. Run authenticate-github-scripts.',
  );
}

const lists: { viewer: { lists: { nodes: { id: string; name: string }[] } } } =
  await graphql(
    `
query lists($count: Int = 100) {
  viewer {
    lists(first: $count) {
      nodes {
        id,
        name
      }
    }
  }
}
`,
    {
      headers: {
        authorization: `token ${token}`,
      },
    },
  );

for (const list of lists.viewer.lists.nodes) {
  console.log(list);

  await graphql(
    `
mutation deleteList($id: ID!) {
  deleteUserList(input: {listId: $id}) {
    clientMutationId
  }
}
`,
    {
      headers: {
        authorization: `token ${token}`,
      },
      id: list.id,
    },
  );
}
