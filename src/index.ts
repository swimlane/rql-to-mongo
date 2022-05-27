import { RQLQuery } from '@swimlane/rql';

import { RQLValidationError } from './interfaces/error';
import { MongoQuery } from './interfaces/mongoQuery';
import { validateRQL } from './validator';

const AND_OPERATOR: string = 'and';
const OR_OPERATOR: string = 'or';
const EQ_OPERATOR: string = 'eq';
const NE_OPERATOR: string = 'ne';
const IN_OPERATOR: string = 'in';
const OUT_OPERATOR: string = 'out';
const LE_OPERATOR: string = 'le';
const LT_OPERATOR: string = 'lt';
const GT_OPERATOR: string = 'gt';
const GE_OPERATOR: string = 'ge';
const SORT_OPERATOR: string = 'sort';
const LIMIT_OPERATOR: string = 'limit';
const AFTER_OPERATOR: string = 'after';
const BEFORE_OPERATOR: string = 'before';
const SELECT_OPERATOR = 'select';

const OPERATOR_TO_CRITERIA = {
  [OR_OPERATOR]: '$or',
  [NE_OPERATOR]: '$ne',
  [IN_OPERATOR]: '$in',
  [OUT_OPERATOR]: '$nin',
  [LE_OPERATOR]: '$lte',
  [LT_OPERATOR]: '$lt',
  [GT_OPERATOR]: '$gt',
  [GE_OPERATOR]: '$gte'
};

/**
 * Converts RQLQuery objects into a MongoQuery object for querying MongoDB
 *
 * @export
 * @class RQLToMongo
 */
export class RQLToMongo {
  /**
   * Helper method to get a MongoQuery object directly from an RQL string.
   * This method will automatically validate the RQL before converting it.
   *
   * @param rql the raw RQL string
   * @returns {MongoQuery}
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static convertRQLString(rql: string): MongoQuery {
    return RQLToMongo.convertRQLQuery(validateRQL(RQLQuery.parse(rql)));
  }

  /**
   * This is the main method. It takes the raw output of the RQL parser,
   * validates it and converts it into a known type, then produces a
   * MongoQuery object as the result.
   *
   * @param {unknown} rql the RQL object output from the RQL parser library
   * @returns {MongoQuery}
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static convertRQLQuery(rqlQuery: RQLQuery): MongoQuery {
    validateRQL(rqlQuery);
    const mongoQuery = RQLToMongo.getDefaultMongoQuery();
    RQLToMongo.parseRQLObj(mongoQuery, mongoQuery.criteria, rqlQuery);
    return mongoQuery;
  }

  /**
   * Recursively process the RQLQuery object, assembling the MongoQuery result
   * and its criteria.
   *
   * @param mongoQuery the result object we are passing around until it's ready
   * @param currentCriteria the criteria field of the MongoQuery object, or a sub-field thereof
   * @param {RQLQuery} rqlQuery the current RQLQuery object under processing
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static parseRQLObj(mongoQuery: MongoQuery, currentCriteria: object, rqlQuery: RQLQuery): void {
    const operator = rqlQuery.name;
    const fieldArg = rqlQuery.args[0];
    switch (operator) {
      case OR_OPERATOR:
      case AND_OPERATOR:
        RQLToMongo.handleSubCriteria(mongoQuery, currentCriteria, rqlQuery);
        break;
      case EQ_OPERATOR:
        if (typeof currentCriteria[fieldArg] === 'object')
          throw new RQLValidationError('conflicting operators: eq for ' + fieldArg);
        currentCriteria[fieldArg] = rqlQuery.args[1];
        break;
      case NE_OPERATOR:
      case LE_OPERATOR:
      case LT_OPERATOR:
      case GT_OPERATOR:
      case GE_OPERATOR:
        if (!currentCriteria[fieldArg]) currentCriteria[fieldArg] = {};
        else if (typeof currentCriteria[fieldArg] !== 'object')
          throw new RQLValidationError('conflicting operators: eq and ' + operator + ' for ' + fieldArg);
        currentCriteria[fieldArg] = Object.assign(currentCriteria[fieldArg], {
          [OPERATOR_TO_CRITERIA[operator]]: rqlQuery.args[1]
        });
        break;
      case IN_OPERATOR:
      case OUT_OPERATOR:
        if (!currentCriteria[fieldArg]) {
          currentCriteria[fieldArg] = {};
        }
        if (typeof currentCriteria[fieldArg] !== 'object') {
          throw new RQLValidationError('conflicting operators: eq and ' + operator + ' for ' + fieldArg);
        }
        let value: unknown = rqlQuery.args[1];
        if (!(value instanceof Array)) value = [value];
        currentCriteria[fieldArg] = Object.assign(currentCriteria[fieldArg], {
          [OPERATOR_TO_CRITERIA[operator]]: value
        });
        break;
      case SELECT_OPERATOR:
        RQLToMongo.handleProjection(mongoQuery, rqlQuery.args);
        break;
      case SORT_OPERATOR:
        RQLToMongo.handleSort(mongoQuery, rqlQuery.args);
        break;
      case LIMIT_OPERATOR:
        RQLToMongo.handleLimit(mongoQuery, rqlQuery.args);
        break;
      case AFTER_OPERATOR:
        RQLToMongo.handleAfter(mongoQuery, rqlQuery.args);
        break;
      case BEFORE_OPERATOR:
        RQLToMongo.handleBefore(mongoQuery, rqlQuery.args);
        break;
      default:
        throw new RQLValidationError('unreachable. unknown operator ' + rqlQuery.name);
    }
  }

  /**
   * Process operators "AND" and "OR" - the arguments to these operators contain
   * a sub-RQLQuery object which will need to be recursively parsed.
   *
   * This does the tricky work of assembling the criteria field (and any sub-fields
   * on the criteria if there are nested AND/OR operators). It does this by passing
   * around a "currentCriteria" object, which may be the root MongoQuery.criteria,
   * or some sub-field thereof.
   *
   * @param mongoQuery the result object we are passing around until it's ready
   * @param currentCriteria the criteria field of the MongoQuery object, or a sub-field thereof
   * @param {RQLQuery} rqlQuery the current RQLQuery object under processing
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static handleSubCriteria(mongoQuery: MongoQuery, currentCriteria: object, rqlQuery: RQLQuery) {
    let nextCriteria = currentCriteria;
    const orCriteria: object[] = [];

    if (rqlQuery.name === OR_OPERATOR) {
      if (!currentCriteria[OPERATOR_TO_CRITERIA[OR_OPERATOR]]) currentCriteria[OPERATOR_TO_CRITERIA[OR_OPERATOR]] = [];
    }
    rqlQuery.args.forEach((arg: any) => {
      if (rqlQuery.name === OR_OPERATOR) {
        nextCriteria = {};
        orCriteria.push(nextCriteria);
      }
      if (arg.name && arg.args) {
        RQLToMongo.parseRQLObj(mongoQuery, nextCriteria, arg);
      } else {
        throw new RQLValidationError('expected RQL as the argument for "' + rqlQuery.name + '" operator');
      }
    });
    if (rqlQuery.name === OR_OPERATOR) {
      currentCriteria[OPERATOR_TO_CRITERIA[OR_OPERATOR]] = currentCriteria[OPERATOR_TO_CRITERIA[OR_OPERATOR]].concat(
        orCriteria
      );
    }
  }
  /**
   * Verify the projection nodes :: It can have exclusion with inclusion for _id field only
   * @param {MongoQuery} mongoQuery the result object we are passing around
   * @returns {void}
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static isProjectionAllowed(mongoQuery: MongoQuery): void {
    const existingNodes = Object.keys(mongoQuery.projection);
    const existingValues = [...new Set(Object.values(mongoQuery.projection))]; // can only have 0 and 1 value
    if (existingValues.length === 2 && !existingNodes.includes('_id')) {
      throw new RQLValidationError('can not send exclusion with inclusion except _id');
    } else if (existingValues.length === 2) {
      for (const key in mongoQuery.projection) {
        if (key !== '_id' && mongoQuery.projection[key] === 0)
          throw new RQLValidationError('can not send exclusion with inclusion except _id');
      }
    }
  }

  /**
   * Handle the projection
   *
   * @param {MongoQuery} mongoQuery the result object we are passing around
   * @param {any[]} args the arguments passed to select(). these should be strings.
   * @returns {void}
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static handleProjection(mongoQuery: MongoQuery, args: any[]): void {
    args.forEach(arg => {
      if (!(typeof arg === 'string')) {
        throw new RQLValidationError('unexpected argument for select operator: expected string');
      } else {
        const inclusion = arg.startsWith('+') ? 1 : arg.startsWith('-') ? 0 : 1;
        const field = arg.startsWith('+') || arg.startsWith('-') ? arg.substring(1) : arg;
        mongoQuery.projection[field] = inclusion;
      }
    });
    RQLToMongo.isProjectionAllowed(mongoQuery);
  }

  /**
   * Handle the sort() operator
   *
   * @param {MongoQuery} mongoQuery the result object we are passing around
   * @param {any[]} args the arguments passed to sort(). these should be strings.
   * @returns {void}
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static handleSort(mongoQuery: MongoQuery, args: any[]): void {
    args.forEach((arg: any) => {
      if (!(typeof arg === 'string')) {
        throw new RQLValidationError('unexpected argument for sort operator: expected string');
      } else {
        const sortDirection = arg.startsWith('+') ? 1 : arg.startsWith('-') ? -1 : 1;
        const sortArg = arg.startsWith('+') || arg.startsWith('-') ? arg.substring(1) : arg;
        mongoQuery.sort[sortArg] = sortDirection;
      }
    });
  }

  /**
   * Handle the limit() operator
   *
   * @param {MongoQuery} mongoQuery the result object we are passing around
   * @param {any[]} args the arguments passed to limit(). these should be integers.
   * @returns {void}
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static handleLimit(mongoQuery: MongoQuery, args: any[]): void {
    if (typeof args[0] !== 'number')
      throw new RQLValidationError('unexpected argument 1 for limit operator: expected number');
    if (args.length > 1 && typeof args[1] !== 'number') {
      throw new RQLValidationError('unexpected argument 2 for limit operator: expected number');
    }
    mongoQuery.limit = args[0];
    if (args.length > 1) mongoQuery.skip = args[1];
  }

  /**
   * Handle the after() operator
   *
   * @param {MongoQuery} mongoQuery the result object we are passing around
   * @param {any[]} args the arguments passed to after(). this should be a string.
   * @returns {void}
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static handleAfter(mongoQuery: MongoQuery, args: any[]): void {
    if (typeof args[0] !== 'string')
      throw new RQLValidationError('unexpected argument 1 for after operator: expected string');
    mongoQuery.after = args[0];
  }

  /**
   * Handle the before() operator
   *
   * @param {MongoQuery} mongoQuery the result object we are passing around
   * @param {any[]} args the arguments passed to before(). this should be a string.
   * @returns {void}
   * @throws {RQLValidationError} if there are any validation errors in the provided RQL
   */
  static handleBefore(mongoQuery: MongoQuery, args: any[]): void {
    if (typeof args[0] !== 'string')
      throw new RQLValidationError('unexpected argument 1 for before operator: expected string');
    mongoQuery.before = args[0];
  }

  /**
   * Factory for default MongoQuery
   *
   * @returns {MongoQuery}
   */
  static getDefaultMongoQuery(): MongoQuery {
    return {
      after: '',
      before: '',
      skip: 0,
      limit: 0,
      criteria: {},
      sort: {},
      projection: {}
    };
  }
}

export * from './interfaces/error';
export * from './interfaces/mongoQuery';
