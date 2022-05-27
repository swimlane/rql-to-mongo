import { RQLQuery } from '@swimlane/rql';

import { RQLValidationError } from './interfaces/error';

/**
 * Validate the RQL object
 *
 * @param rql
 * @throws {RQLValidationError} if an unknown operator or invalid parameters are
 *  found
 */
export function validateRQL(rqlQuery: RQLQuery): RQLQuery {
  const rqlArgs = rqlQuery.args.filter(RQLQuery.isRQLQuery);
  switch (rqlQuery.name.toLowerCase()) {
    case 'eq':
    case 'ne':
    case 'in':
    case 'out':
    case 'le':
    case 'lt':
    case 'gt':
    case 'ge':
      if (rqlArgs.length > 0) {
        throw new RQLValidationError(`RQL is not allowed in arguments for operator: ${rqlQuery.name}`);
      } else {
        return rqlQuery;
      }
    case 'and':
    case 'or':
      if (rqlArgs.length !== rqlQuery.args.length) {
        throw new RQLValidationError(`RQL is required in arguments for operator: ${rqlQuery.name}`);
      } else {
        rqlQuery.args.forEach(validateRQL);
        return rqlQuery;
      }
    case 'sort':
      if (rqlQuery.args.filter(arg => typeof arg !== 'string').length > 0) {
        throw new RQLValidationError(`RQL Operator ${rqlQuery.name} requires string arguments`);
      } else {
        return rqlQuery;
      }
    case 'select':
      if (rqlQuery.args.filter(arg => typeof arg !== 'string').length > 0) {
        throw new RQLValidationError(`RQL Operator ${rqlQuery.name} requires string arguments`);
      } else {
        return rqlQuery;
      }
    case 'limit':
      if (rqlQuery.args.length === 0 || typeof rqlQuery.args[0] !== 'number') {
        throw new RQLValidationError(`RQL Operator ${rqlQuery.name} requires a number as the first argument`);
      }
      if (rqlQuery.args.length > 1 && typeof rqlQuery.args[1] !== 'number') {
        throw new RQLValidationError(`RQL Operator ${rqlQuery.name} requires a number as the second argument`);
      }
      return rqlQuery;
    case 'after':
      if (rqlQuery.args.length === 0 || typeof rqlQuery.args[0] !== 'string') {
        throw new RQLValidationError(`RQL Operator ${rqlQuery.name} requires a string as the first argument`);
      }
      return rqlQuery;
    case 'before':
      if (rqlQuery.args.length === 0 || typeof rqlQuery.args[0] !== 'string') {
        throw new RQLValidationError(`RQL Operator ${rqlQuery.name} requires a string as the first argument`);
      }
      return rqlQuery;
    default:
      throw new RQLValidationError(`RQL Operator is not allowed: ${rqlQuery.name}`);
  }
}
