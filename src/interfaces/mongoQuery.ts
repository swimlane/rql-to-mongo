/**
 * Use this object to query MongoDB
 *
 * @export
 * @interface MongoQuery
 */
export interface MongoQuery {
  after: string;
  skip: number;
  limit: number;
  criteria: any;
  sort: object;
}
