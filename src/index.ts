import { parseQuery } from 'rql/parser';

import { MongoQuery } from './interfaces/mongoQuery';
import { ParsedRQL } from './interfaces/parsedRQL';
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

export class RQLToMongo {
  /**
   * Helper method to get a MongoQuery object directly from an RQL string.
   * This method will automatically validate the RQL before converting it.
   *
   * @param rql the raw RQL string
   * @returns {MongoQuery}
   * @throws {Error} if there are any validation errors in the provided RQL
   */
  static convertRQLString(rql: string): MongoQuery {
    return RQLToMongo.convertParsedRQL(validateRQL(parseQuery(rql)));
  }

  /**
   * This is the main method. It takes the raw output of the RQL parser,
   * validates it and converts it into a known type, then produces a
   * MongoQuery object as the result.
   *
   * @param {unknown} rql the RQL object output from the RQL parser library
   * @returns {MongoQuery}
   * @throws {Error} if there are any validation errors in the provided RQL
   */
  static convertParsedRQL(rql: unknown): MongoQuery {
    const parsedRQL: ParsedRQL = validateRQL(rql);
    const mongoQuery = new MongoQuery();
    RQLToMongo.parseRQLObj(mongoQuery, mongoQuery.criteria, parsedRQL);
    return mongoQuery;
  }

  /**
   * Recursively process the ParsedRQL object, assembling the MongoQuery result
   * and its criteria.
   *
   * @param mongoQuery the result object we are passing around until it's ready
   * @param currentCriteria the criteria field of the MongoQuery object, or a sub-field thereof
   * @param {ParsedRQL} parsedRQL the current ParsedRQL object under processing
   */
  static parseRQLObj(mongoQuery: MongoQuery, currentCriteria: object, parsedRQL: ParsedRQL): void {
    const operator = parsedRQL.name;
    const fieldArg = parsedRQL.args[0];
    switch (operator) {
      case OR_OPERATOR:
      case AND_OPERATOR:
        RQLToMongo.handleSubCriteria(mongoQuery, currentCriteria, parsedRQL);
        break;
      case EQ_OPERATOR:
        if (typeof currentCriteria[fieldArg] === 'object') throw new Error('conflicting operators: eq for ' + fieldArg);
        currentCriteria[fieldArg] = parsedRQL.args[1];
        break;
      case NE_OPERATOR:
      case LE_OPERATOR:
      case LT_OPERATOR:
      case GT_OPERATOR:
      case GE_OPERATOR:
        if (!currentCriteria[fieldArg]) currentCriteria[fieldArg] = {};
        else if (typeof currentCriteria[fieldArg] !== 'object')
          throw new Error('conflicting operators: eq and ' + operator + ' for ' + fieldArg);
        currentCriteria[fieldArg] = Object.assign(currentCriteria[fieldArg], {
          [OPERATOR_TO_CRITERIA[operator]]: parsedRQL.args[1]
        });
        break;
      case IN_OPERATOR:
      case OUT_OPERATOR:
        if (!currentCriteria[fieldArg]) currentCriteria[fieldArg] = {};
        else if (typeof currentCriteria[fieldArg] !== 'object')
          throw new Error('conflicting operators: eq and ' + operator + ' for ' + fieldArg);
        let value: unknown = parsedRQL.args[1];
        if (!(value instanceof Array)) value = [value];
        currentCriteria[fieldArg] = Object.assign(currentCriteria[fieldArg], {
          [OPERATOR_TO_CRITERIA[operator]]: value
        });
        break;
      case SORT_OPERATOR:
        RQLToMongo.handleSort(mongoQuery, parsedRQL.args);
        break;
      case LIMIT_OPERATOR:
        RQLToMongo.handleLimit(mongoQuery, parsedRQL.args);
        break;
      case AFTER_OPERATOR:
        RQLToMongo.handleAfter(mongoQuery, parsedRQL.args);
        break;
      default:
        throw new Error('unknown operator ' + parsedRQL.name);
    }
  }

  /**
   * Process operators "AND" and "OR" - the arguments to these operators contain
   * a sub-ParsedRQL object which will need to be recursively parsed.
   *
   * This does the tricky work of assembling the criteria field (and any sub-fields
   * on the criteria if there are nested AND/OR operators). It does this by passing
   * around a "currentCriteria" object, which may be the root MongoQuery.criteria,
   * or some sub-field thereof.
   *
   * @param mongoQuery the result object we are passing around until it's ready
   * @param currentCriteria the criteria field of the MongoQuery object, or a sub-field thereof
   * @param {ParsedRQL} parsedRQL the current ParsedRQL object under processing
   */
  static handleSubCriteria(mongoQuery: MongoQuery, currentCriteria: object, parsedRQL: ParsedRQL) {
    let nextCriteria = currentCriteria;
    const orCriteria: object[] = [];

    if (parsedRQL.name === OR_OPERATOR) {
      if (!currentCriteria[OPERATOR_TO_CRITERIA[OR_OPERATOR]]) currentCriteria[OPERATOR_TO_CRITERIA[OR_OPERATOR]] = [];
    }
    parsedRQL.args.forEach((arg: any) => {
      if (parsedRQL.name === OR_OPERATOR) {
        nextCriteria = {};
        orCriteria.push(nextCriteria);
      }
      if (arg.name && arg.args) {
        RQLToMongo.parseRQLObj(mongoQuery, nextCriteria, arg);
      } else {
        throw new Error('expected RQL as the argument for "' + parsedRQL.name + '" operator');
      }
    });
    if (parsedRQL.name === OR_OPERATOR) {
      currentCriteria[OPERATOR_TO_CRITERIA[OR_OPERATOR]] = currentCriteria[OPERATOR_TO_CRITERIA[OR_OPERATOR]].concat(
        orCriteria
      );
    }
  }

  /**
   * Handle the sort() operator
   *
   * @param {MongoQuery} mongoQuery the result object we are passing around
   * @param {any[]} args the arguments passed to sort(). these should be strings.
   * @returns {void}
   */
  static handleSort(mongoQuery: MongoQuery, args: any[]): void {
    args.forEach((arg: any) => {
      if (!(typeof arg === 'string')) {
        throw new Error('unexpected argument for sort operator: expected string');
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
   */
  static handleLimit(mongoQuery: MongoQuery, args: any[]): void {
    if (typeof args[0] !== 'number') throw new Error('unexpected argument 1 for limit operator: expected number');
    if (args.length > 1 && typeof args[1] !== 'number')
      throw new Error('unexpected argument 2 for limit operator: expected number');
    mongoQuery.limit = args[0];
    if (args.length > 1) mongoQuery.skip = args[1];
  }

  /**
   * Handle the after() operator
   *
   * @param {MongoQuery} mongoQuery the result object we are passing around
   * @param {any[]} args the arguments passed to after(). this should be a string.
   * @returns {void}
   */
  static handleAfter(mongoQuery: MongoQuery, args: any[]): void {
    // this is perhaps a purely numeric hex string. just make it a string.
    mongoQuery.after = args[0].toString();
  }
}
