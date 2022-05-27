import { RQLQuery } from '@swimlane/rql';
import { expect } from 'chai';

import { RQLToMongo } from './index';
import { MongoQuery } from './interfaces/mongoQuery';
import { validateRQL } from './validator';

describe('convertRQLQuery', () => {
  describe('when the input has an invalid RQL operator', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        RQLToMongo.convertRQLQuery(new RQLQuery('search', []));
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/RQL Operator is not allowed: search/);
      }
    });
  });

  describe('when incompatible criteria are passed with equals', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(RQLQuery.parse('eq(foo,1),ne(foo,2)'));
    });

    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        RQLToMongo.convertRQLQuery(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/conflicting operators: eq/);
      }
    });
  });

  describe('when incompatible criteria are passed with equals second', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(RQLQuery.parse('ne(foo,2),eq(foo,1)'));
    });

    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        RQLToMongo.convertRQLQuery(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/conflicting operators: eq/);
      }
    });
  });

  describe('when incompatible criteria are passed with equals and in/out', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(RQLQuery.parse('eq(foo,2),in(foo,1)'));
    });

    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        RQLToMongo.convertRQLQuery(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/conflicting operators: eq/);
      }
    });
  });

  describe('when valid RQL is passed', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(
        RQLQuery.parse('and(and(gt(utc,1574349588000),eq(things.example_thing_name.value,688692340)),eq(some,thing))')
      );
    });

    it('should return a valid mongo query object', () => {
      expect(RQLToMongo.convertRQLQuery(rqlQuery)).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          some: 'thing',
          'things.example_thing_name.value': 688692340,
          utc: {
            $gt: 1574349588000
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('when a parent field and a sub-field both have settings', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(RQLQuery.parse('eq(foo,2),eq(foo.bar,1)'));
    });

    it('should build both criteria', () => {
      expect(RQLToMongo.convertRQLQuery(rqlQuery)).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          foo: 2,
          'foo.bar': 1
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('when valid RQL with nested and/or is passed', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(
        RQLQuery.parse(
          'or(and(gt(heartbeat,1574349588000),eq(things.example_thing_name.value,688692340)),eq(some,thing))'
        )
      );
    });

    it('should return a valid mongo query object', () => {
      expect(RQLToMongo.convertRQLQuery(rqlQuery)).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          $or: [
            {
              heartbeat: {
                $gt: 1574349588000
              },
              'things.example_thing_name.value': 688692340
            },
            {
              some: 'thing'
            }
          ]
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('when valid RQL sort() is passed', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(RQLQuery.parse('ge(testInt,991063125)&sort(heartbeat,-things.example_thing_name.value)'));
    });

    it('should return a valid mongo query object', () => {
      expect(RQLToMongo.convertRQLQuery(rqlQuery)).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt: {
            $gte: 991063125
          }
        },
        limit: 0,
        skip: 0,
        sort: {
          heartbeat: 1,
          'things.example_thing_name.value': -1
        },
        projection: {}
      });
    });
  });

  describe('when valid RQL limit() and after() is passed', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      const parsedQuery: RQLQuery = RQLQuery.parse(
        'ge(testInt,991063125)&sort(heartbeat,-things.example_thing_name.value)&limit(10,2)&after(5dd6c6ccebd0d60f7a82cc0e)'
      );
      rqlQuery = validateRQL(parsedQuery);
    });

    it('should return a valid mongo query object', () => {
      expect(RQLToMongo.convertRQLQuery(rqlQuery)).to.deep.eq({
        after: '5dd6c6ccebd0d60f7a82cc0e',
        before: '',
        criteria: {
          testInt: {
            $gte: 991063125
          }
        },
        limit: 10,
        skip: 2,
        sort: {
          heartbeat: 1,
          'things.example_thing_name.value': -1
        },
        projection: {}
      });
    });
  });

  describe('when valid RQL limit() and before() is passed', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      const parsedQuery: RQLQuery = RQLQuery.parse(
        'ge(testInt,991063125)&sort(heartbeat,-things.example_thing_name.value)&limit(10,2)&before(5dd6c6ccebd0d60f7a82cc0e)'
      );
      rqlQuery = validateRQL(parsedQuery);
    });

    it('should return a valid mongo query object', () => {
      expect(RQLToMongo.convertRQLQuery(rqlQuery)).to.deep.eq({
        after: '',
        before: '5dd6c6ccebd0d60f7a82cc0e',
        criteria: {
          testInt: {
            $gte: 991063125
          }
        },
        limit: 10,
        skip: 2,
        sort: {
          heartbeat: 1,
          'things.example_thing_name.value': -1
        },
        projection: {}
      });
    });
  });
});

describe('operators', () => {
  describe('unknown', () => {
    it('should throw an error about an unknown operator', () => {
      let e: Error | null = null;
      try {
        RQLToMongo.convertRQLString('foo(testInt,991063125)');
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/RQL Operator is not allowed: foo/);
      }
    });
  });

  describe('eq', () => {
    it('should return a mongo query object with equals criteria', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt,991063125)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt: 991063125
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('ne', () => {
    it('should return a mongo query object with not equals criteria', () => {
      expect(RQLToMongo.convertRQLString('ne(testInt,991063125)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt: {
            $ne: 991063125
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('in', () => {
    it('should return a mongo query object with in criteria', () => {
      expect(RQLToMongo.convertRQLString('in(testIntArr,991063125)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testIntArr: {
            $in: [991063125]
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('out', () => {
    it('should return a mongo query object with out criteria', () => {
      expect(RQLToMongo.convertRQLString('out(testIntArr,991063125)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testIntArr: {
            $nin: [991063125]
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('le', () => {
    it('should return a mongo query object with less than equal to criteria', () => {
      expect(RQLToMongo.convertRQLString('le(testInt,991063125)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt: {
            $lte: 991063125
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('lt', () => {
    it('should return a mongo query object with less than criteria', () => {
      expect(RQLToMongo.convertRQLString('lt(testInt,991063125)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt: {
            $lt: 991063125
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('gt', () => {
    it('should return a mongo query object with greater than criteria', () => {
      expect(RQLToMongo.convertRQLString('gt(testInt,991063125)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt: {
            $gt: 991063125
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('ge', () => {
    it('should return a mongo query object with greater than equal to criteria', () => {
      expect(RQLToMongo.convertRQLString('ge(testInt,991063125)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt: {
            $gte: 991063125
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('and', () => {
    it('should return a mongo query object with and criteria', () => {
      expect(RQLToMongo.convertRQLString('and(gt(testInt,991063125),lt(testInt,999993125))')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt: {
            $gt: 991063125,
            $lt: 999993125
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('or', () => {
    it('should return a mongo query object with or criteria', () => {
      expect(RQLToMongo.convertRQLString('or(gt(testInt,991063125),lt(testInt,999993125))')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          $or: [
            {
              testInt: {
                $gt: 991063125
              }
            },
            {
              testInt: {
                $lt: 999993125
              }
            }
          ]
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('select', () => {
    it('should return a mongo query object with inlusive projection', () => {
      expect(RQLToMongo.convertRQLString('select(+name,+type)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {},
        projection: {
          name: 1,
          type: 1
        }
      });
    });
    it('should return a mongo query object with exclusive projection', () => {
      expect(RQLToMongo.convertRQLString('select(-name,-type)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {},
        projection: {
          name: 0,
          type: 0
        }
      });
    });
    it('should return a mongo query object with exclusive _id and inclusive projection', () => {
      expect(RQLToMongo.convertRQLString('select(+name,-_id)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {},
        projection: {
          name: 1,
          _id: 0
        }
      });
    });
  });

  describe('sort ascending', () => {
    it('should return a mongo query object with ascending sort criteria', () => {
      expect(RQLToMongo.convertRQLString('sort(+testInt)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {
          testInt: 1
        },
        projection: {}
      });
    });
  });

  describe('sort descending', () => {
    it('should return a mongo query object with descending sort criteria', () => {
      expect(RQLToMongo.convertRQLString('sort(-testInt)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {
          testInt: -1
        },
        projection: {}
      });
    });
  });

  describe('sort default', () => {
    it('should return a mongo query object with default sort criteria', () => {
      expect(RQLToMongo.convertRQLString('sort(testInt)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {
          testInt: 1
        },
        projection: {}
      });
    });
  });

  describe('sort multiple', () => {
    it('should return a mongo query object with multiple sort criteria', () => {
      expect(RQLToMongo.convertRQLString('sort(testInt,-price,+name,-id)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {
          testInt: 1,
          price: -1,
          name: 1,
          id: -1
        },
        projection: {}
      });
    });
  });

  describe('limit', () => {
    it('should return a mongo query object with limit criteria', () => {
      expect(RQLToMongo.convertRQLString('limit(300)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 300,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('limit and skip', () => {
    it('should return a mongo query object with limit and skip criteria', () => {
      expect(RQLToMongo.convertRQLString('limit(300,12)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {},
        limit: 300,
        skip: 12,
        sort: {},
        projection: {}
      });
    });
  });

  describe('after', () => {
    it('should return a mongo query object with after criteria', () => {
      expect(RQLToMongo.convertRQLString('after(01a0b9f08238fde)')).to.deep.eq({
        after: '01a0b9f08238fde',
        before: '',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('before', () => {
    it('should return a mongo query object with before criteria', () => {
      expect(RQLToMongo.convertRQLString('before(01a0b9f08238fde)')).to.deep.eq({
        after: '',
        before: '01a0b9f08238fde',
        criteria: {},
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('combined', () => {
    it('should return a mongo query object with many combined criteria', () => {
      const rqlString =
        'and(eq(testField1,111111),ne(testField2,222222),in(testFieldArr1,333333)),' +
        'or(and(out(testFieldArr1,4444444),or(le(testField3,555555),out(testFieldArr1,555555))),lt(testField4,666666)),' +
        'and(gt(testField3,777777),ge(testField5,888888),or(lt(testField2,9999999),gt(testField2,888888))),' +
        'sort(testField2,-testField3),limit(500,5),after(01a0b9f08238fde)';
      expect(RQLToMongo.convertRQLString(rqlString)).to.deep.eq({
        after: '01a0b9f08238fde',
        before: '',
        criteria: {
          $or: [
            {
              $or: [
                {
                  testField3: {
                    $lte: 555555
                  }
                },
                {
                  testFieldArr1: {
                    $nin: [555555]
                  }
                }
              ],
              testFieldArr1: {
                $nin: [4444444]
              }
            },
            {
              testField4: {
                $lt: 666666
              }
            },
            {
              testField2: {
                $lt: 9999999
              }
            },
            {
              testField2: {
                $gt: 888888
              }
            }
          ],
          testField1: 111111,
          testField2: {
            $ne: 222222
          },
          testField3: {
            $gt: 777777
          },
          testField5: {
            $gte: 888888
          },
          testFieldArr1: {
            $in: [333333]
          }
        },
        limit: 500,
        skip: 5,
        sort: {
          testField2: 1,
          testField3: -1
        },
        projection: {}
      });
    });
  });

  describe('fields, sub-fields, and constants', () => {
    it('should return a mongo query object with criteria comparing field to constant', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,9999999)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: 9999999
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria comparing field to field', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,testInt2)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: 'testInt2'
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria comparing sub-field to constant', () => {
      expect(RQLToMongo.convertRQLString('eq(some.sub.field.testInt1,999999)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          'some.sub.field.testInt1': 999999
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria comparing sub-field to sub-field', () => {
      expect(RQLToMongo.convertRQLString('eq(some.sub.field.testInt1,some.sub.field.testInt2)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          'some.sub.field.testInt1': 'some.sub.field.testInt2'
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });

  describe('type assertions', () => {
    it('should return a mongo query object with criteria having a number in number form', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,9999999)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: 9999999
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having a number in string form', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,string:9999999)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: '9999999'
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having a boolean in boolean form', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,true)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: true
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having a boolean in string form', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,string:true)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: 'true'
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having a double in double form', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,5.921)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: 5.921
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having a double in string form', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,string:5.921)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: '5.921'
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with in criteria having an array', () => {
      expect(RQLToMongo.convertRQLString('in(testInt1,(5,6,7,8))')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: {
            $in: [5, 6, 7, 8]
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with out criteria having an array', () => {
      expect(RQLToMongo.convertRQLString('out(testInt1,(5,6,7,8))')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: {
            $nin: [5, 6, 7, 8]
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having null', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,null)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: null
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having null in string form', () => {
      expect(RQLToMongo.convertRQLString('eq(testInt1,string:null)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          testInt1: 'null'
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having an isodate', () => {
      expect(RQLToMongo.convertRQLString('gt(foo,isodate:2001-01-01T00:00:00)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          foo: {
            $gt: new Date('2001-01-01T00:00:00.000Z')
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });

    it('should return a mongo query object with criteria having an epoch date', () => {
      expect(RQLToMongo.convertRQLString('gt(foo,epoch:1574356414937)')).to.deep.eq({
        after: '',
        before: '',
        criteria: {
          foo: {
            $gt: new Date('2019-11-21T17:13:34.937Z')
          }
        },
        limit: 0,
        skip: 0,
        sort: {},
        projection: {}
      });
    });
  });
});

describe('parseRQLObj', () => {
  describe('when an unknown operator is passed', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(RQLQuery.parse('and(eq(foo,2))'));
      rqlQuery.args.push({
        name: 'unknown',
        args: ['foo']
      });
    });

    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        const mongoQuery = RQLToMongo.getDefaultMongoQuery();
        RQLToMongo.parseRQLObj(mongoQuery, mongoQuery.criteria, rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/unknown operator/);
      }
    });
  });
});

describe('handleSubCriteria', () => {
  describe('when non-RQL is passed when RQL is required', () => {
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = validateRQL(RQLQuery.parse('eq(foo,2)'));
      rqlQuery.args.push({
        name: 'and',
        args: ['foo']
      });
    });

    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        const mongoQuery = RQLToMongo.getDefaultMongoQuery();
        RQLToMongo.handleSubCriteria(mongoQuery, mongoQuery.criteria, rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/expected RQL as the argument/);
      }
    });
  });
});

describe('handleSort', () => {
  describe('when non-string arg is passed', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        const mongoQuery = RQLToMongo.getDefaultMongoQuery();
        RQLToMongo.handleSort(mongoQuery, [1]);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/unexpected argument for sort operator: expected string/);
      }
    });
  });
});

describe('handleProjection', () => {
  describe('when non-string arg is passed', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        const mongoQuery = RQLToMongo.getDefaultMongoQuery();
        RQLToMongo.handleProjection(mongoQuery, [1]);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/unexpected argument for select operator: expected string/);
      }
    });
  });
});

describe('handleLimit', () => {
  describe('when non-number arg 1 is passed', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        const mongoQuery = RQLToMongo.getDefaultMongoQuery();
        RQLToMongo.handleLimit(mongoQuery, ['a']);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/unexpected argument 1 for limit operator: expected number/);
      }
    });
  });

  describe('when non-number arg 2 is passed', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        const mongoQuery = RQLToMongo.getDefaultMongoQuery();
        RQLToMongo.handleLimit(mongoQuery, [1, 'b']);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/unexpected argument 2 for limit operator: expected number/);
      }
    });
  });

  describe('handleAfter', () => {
    describe('when non-string arg is passed', () => {
      it('should throw an error', () => {
        let e: Error | null = null;
        try {
          const mongoQuery = RQLToMongo.getDefaultMongoQuery();
          RQLToMongo.handleAfter(mongoQuery, [1]);
        } catch (err) {
          e = err;
        } finally {
          expect(e).to.not.be.null;
          if (e) expect(e.message).to.match(/unexpected argument 1 for after operator: expected string/);
        }
      });
    });
  });

  describe('handleBefore', () => {
    describe('when non-string arg is passed', () => {
      it('should throw an error', () => {
        let e: Error | null = null;
        try {
          const mongoQuery = RQLToMongo.getDefaultMongoQuery();
          RQLToMongo.handleBefore(mongoQuery, [1]);
        } catch (err) {
          e = err;
        } finally {
          expect(e).to.not.be.null;
          if (e) expect(e.message).to.match(/unexpected argument 1 for before operator: expected string/);
        }
      });
    });
  });
});
