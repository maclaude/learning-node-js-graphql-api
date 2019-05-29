/**
 * NPM import
 */
const { buildSchema } = require('graphql');

/**
 * Code
 */
module.exports = buildSchema(`
  type TestData {
    text: String!
    views: Int!
  }

  type RootQuery {
    hello: TestData!
  }

  schema {
    query: RootQuery
  }
`);
