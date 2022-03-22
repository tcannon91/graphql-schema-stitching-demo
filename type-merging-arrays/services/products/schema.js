const { makeExecutableSchema } = require('@graphql-tools/schema');
const NotFoundError = require('../../lib/not_found_error');
const readFileSync = require('../../lib/read_file_sync');
const typeDefs = readFileSync(__dirname, 'schema.graphql');

// data fixtures
const products = [
  { upc: '1', name: 'iPhone', price: 699.99, manufacturerId: '1', thingId: 'abc' },
  { upc: '2', name: 'Apple Watch', price: 399.99, manufacturerId: '2', thingId: 'def' },
  { upc: '3', name: 'Super Baking Cookbook', price: 15.99, manufacturerId: '2', thingId: 'many' },
  { upc: '4', name: 'Best Selling Novel', price: 7.99, manufacturerId: '2', thingId: 'abc' },
  { upc: '5', name: 'iOS Survival Guide', price: 24.99, manufacturerId: '1', thingId: 'def' },
  { upc: '6', name: 'Baseball Glove', price: 17.99, manufacturerId: '99' }, // << invalid manufacturer!
];

const taylorThings = [
  {
    id: 'abc',
    meta1: '123',
    meta2: '456',
    attr1: 'my 1st attribute 1',
    attr2: 'my 2nd attribute 1',
    attr3: 'my 3rd attribute 1',
  },
  {
    id: 'def',
    meta1: '789',
    meta2: '010',
    attr1: 'my 1st attribute 2',
    attr2: 'my 2nd attribute 2',
    attr3: 'my 3rd attribute 2',
  },
  {
    id: 'many',
    meta1: null,
    meta2: null,
    attr1: 'my 1st attribute 3',
    attr2: 'my 2nd attribute 3',
    attr3: 'my 3rd attribute 3',
  }
];

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: {
      product(root, { upc }) {
        return products.find(p => p.upc === upc) || new NotFoundError();
      },
      products(root, { upcs }) {
        return upcs.map(upc => products.find(p => p.upc === upc) || new NotFoundError());
      },
      _manufacturers(root, { ids }) {
        return ids.map(id => ({ id, products: products.filter(p => p.manufacturerId === id) }));
      }
    },
    Product: {
      manufacturer: (product) => ({ id: product.manufacturerId }),
      things: (product) => taylorThings.filter(th => th.id === product.thingId),
    },
    Manufacturer: {
      products: (manufacturer) => products.filter(p => p.manufacturerId === manufacturer.id),
    },
    TaylorThing: {
      id: (thing) => thing.id,
      meta1: (thing) => thing.meta1,
      meta2: (thing) => thing.meta2,
      attr1: (thing) => thing.attr1,
      attr2: (thing) => thing.attr2,
      attr3: (thing) => thing.attr3,
    }
  }
});
