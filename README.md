# rql-to-mongo

Convert [RQL](https://github.com/swimlane/rql) into MongoDB queries

[![Build
Status](https://travis-ci.org/swimlane/rql-to-mongo.svg?branch=master)](https://travis-ci.org/swimlane/rql-to-mongo)

# Example

```ts
import { MongoQuery, RQLToMongo } from '@swimlane/rql-to-mongo';
import { RQLQuery } from '@swimlane/rql';

const rqlQuery: RQLQuery = RQLQuery.parse('eq(foo,3)&sort(-date)&limit(100,10)');
const mongoQuery = RQLToMongo.convertRQLQuery(rqlQuery);

cursor = db.collection.find(mongoQuery.criteria, {
	skip: mongoQuery.skip,
	limit: mongoQuery.limit,
	sort: mongoQuery.sort
});

cursor.toArray(function (err, docs) {
	// ...
});
```

# Supported RQL operators

Only a limited set of operators are currently supported:

### Comparison

- eq(field,value): Mongo operator $eq. Matches values that are equal to a specified value.
- gt(field,value): Mongo operator $gt. Matches values that are greater than a specified value.
- ge(field,value): Mongo operator $gte. Matches values that are greater than or equal to a specified value.
- in(field,arrayValue): Mongo operator $in. Matches any of the values specified in an array.
- lt(field,value): Mongo operator $lt. Matches values that are less than a specified value.
- le(field,value): Mongo operator $lte. Matches values that are less than or equal to a specified value.
- ne(field,value): Mongo operator $ne. Matches all values that are not equal to a specified value.
- out(field,value): Mongo operator $nin. Matches none of the values specified in an array.

### Logical operators

- and(rqlQuery1,rqlQuery2...): Mongo operator $and. Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
- or(rqlQuery1,rqlQuery2...): Mongo operator $or. Joins query clauses with a logical OR returns all documents that match the conditions of either clause.

### Paging operators

- sort(+field1,-field2): Sorts the results. + for ascending, - for descending.
- limit(maximum,skip): Takes two args: maximum is a number which indicates the maximum number of results to return. Skip is a number which indicates how many items should be skipped before collecting the results
- after(cursor): Takes a cursor identifying where to start the page of results
- before(cursor): Takes a cursor identifying where to start a page of results going backwards in the list

Note: Cursor paginating using before() and after() is not directly supported by MongoDB. It requires some extra code or another library such as [mongo-cursor-pagination](https://github.com/mixmaxhq/mongo-cursor-pagination) to use these.

# MongoQuery

The result object which is used for querying MongoDB:

- `after: string;` The cursor identifying which item to skip to when collecting a result set
- `before: string;` The cursor identifying the last item when collecting a result set going backwards
- `skip: number;` The number of items to skip before collecting the results
- `limit: number;` The maximum number of results to return
- `criteria: any;` The MongoDB query criteria
- `sort: object;` The MongoDB sorting criteria

# Install

With [npm](https://npmjs.org/package/npm) do:

```sh
npm install @swimlane/rql-to-mongo
```

# Credits

`rql-to-mongo` is a [Swimlane](http://swimlane.com) open-source project; we believe in giving back to the open-source community by sharing some of the projects we build for our application. Swimlane is an automated cyber security operations and incident response platform that enables cyber security teams to leverage threat intelligence, speed up incident response and automate security operations.

[SecOps Hub](http://secopshub.com) is an open, product-agnostic, online community for security professionals to share ideas, use cases, best practices, and incident response strategies.
