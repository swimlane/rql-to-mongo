import { expect } from 'chai';

import { RQLQuery } from './rql/query';
import { validateRQL } from './validator';

describe('validateRQL', () => {
  describe('when RQL is passed as an argument to non-RQL operators', () => {
    const rqlString: string = 'gt(foo,and(1,2))';
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = RQLQuery.parse(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/RQL is not allowed in arguments for operator/);
      }
    });
  });

  describe('when RQL is NOT passed as an argument to RQL operators', () => {
    const rqlString: string = 'and(foo,1)';
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = RQLQuery.parse(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/RQL is required in arguments for operator/);
      }
    });
  });

  describe('when non-string args are passed to sort()', () => {
    const rqlString: string = 'sort(1,2)';
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = RQLQuery.parse(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/requires string arguments/);
      }
    });
  });

  describe('when no args are passed to limit()', () => {
    const rqlString: string = 'limit()';
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = RQLQuery.parse(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/requires a number as the first argument/);
      }
    });
  });

  describe('when non-number first arg is passed to limit()', () => {
    const rqlString: string = 'limit(a)';
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = RQLQuery.parse(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/requires a number as the first argument/);
      }
    });
  });

  describe('when non-number second arg is passed to limit()', () => {
    const rqlString: string = 'limit(1,b)';
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = RQLQuery.parse(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/requires a number as the second argument/);
      }
    });
  });

  describe('when no args are passed to after()', () => {
    const rqlString: string = 'after()';
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = RQLQuery.parse(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/requires a string as the first argument/);
      }
    });
  });

  describe('when non-string first arg is passed to after()', () => {
    const rqlString: string = 'after(1)';
    let rqlQuery: RQLQuery;
    beforeEach(() => {
      rqlQuery = RQLQuery.parse(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(rqlQuery);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/requires a string as the first argument/);
      }
    });
  });
});
