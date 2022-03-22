const { makeExecutableSchema } = require('@graphql-tools/schema');
const NotFoundError = require('../../lib/not_found_error');
const readFileSync = require('../../lib/read_file_sync');
const typeDefs = readFileSync(__dirname, 'schema.graphql');

// data fixtures
const manufacturers = [
  { id: '1', name: 'Apple' },
  { id: '2', name: 'Macmillan' },
];

const taylorThings = [
  {
    id: 'abc',
    attr4: 'my 4th attribute 1',
  },
  {
    id: 'def',
    attr4: 'my 4th attribute 2',
  },
];

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: {
      manufacturers(root, { ids }) {
        return ids.map(id => manufacturers.find(m => m.id === id) || new NotFoundError());
      },
      _manTaylorThings(root, { filters }) {
        console.log('filters:', filters);
        const resultsMap = {};

        filters.forEach(filter => {
          if (!filter.meta1 && !filter.meta2) {
            taylorThings.forEach((tt) => {
              resultsMap[tt.id] = {...tt};
            });
          }

          if (filter.meta1 === '123') {
            resultsMap.abc = {...taylorThings.find((tt) => tt.id === 'abc')};
          }

          if (filter.meta1 === '789') {
            resultsMap.def = {...taylorThings.find((tt) => tt.id === 'def')};
          }
        });

        if (Object.values(resultsMap).length > 1) {
          return null;
        }

        return Object.values(resultsMap);
      }
    }
  }
});
