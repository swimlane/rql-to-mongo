import { ParsedRQL } from './interfaces/parsedRQL';

/**
 * Validate the RQL object
 *
 * @param rql
 */
export function validateRQL(rql: unknown): ParsedRQL {
  if (isRQL(rql)) {
    const rqlArgs = rql.args.filter(isRQL);
    switch (rql.name.toLowerCase()) {
      case 'eq':
      case 'ne':
      case 'in':
      case 'out':
      case 'le':
      case 'lt':
      case 'gt':
      case 'ge':
        if (rqlArgs.length > 0) {
          throw new Error(`RQL is not allowed in arguments for operator: ${rql.name}`);
        } else {
          return rql;
        }
      case 'and':
      case 'or':
        if (rqlArgs.length !== rql.args.length) {
          throw new Error(`RQL is required in arguments for operator: ${rql.name}`);
        } else {
          rql.args.forEach(validateRQL);
          return rql;
        }
      case 'sort':
        if (rql.args.filter(arg => typeof arg !== 'string').length > 0) {
          throw new Error(`RQL Operator ${rql.name} requires string arguments`);
        } else {
          return rql;
        }
      case 'limit':
        if (rql.args.length === 0 || typeof rql.args[0] !== 'number') {
          throw new Error(`RQL Operator ${rql.name} requires a number as the first argument`);
        }
        if (rql.args.length > 1 && typeof rql.args[1] !== 'number') {
          throw new Error(`RQL Operator ${rql.name} requires a number as the second argument`);
        }
        return rql;
      case 'after':
        if (rql.args.length === 0 || typeof rql.args[0] !== 'string') {
          throw new Error(`RQL Operator ${rql.name} requires a string as the first argument`);
        }
        return rql;
      default:
        throw new Error(`RQL Operator is not allowed: ${rql.name}`);
    }
  } else {
    throw new Error('Argument is not valid RQL object');
  }
}

/**
 * Check if object is RQL
 *
 * @param rql Object to check
 */
export function isRQL(rql: unknown): rql is ParsedRQL {
  return typeof rql === 'object' && rql !== null && rql.hasOwnProperty('name') && rql.hasOwnProperty('args');
}
