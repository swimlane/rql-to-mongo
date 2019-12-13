export interface MongoQuery {
  after: string;
  skip: number;
  limit: number;
  criteria: any;
  sort: object;
}
