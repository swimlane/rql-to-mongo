import { expect } from 'chai';
import { parseQuery } from 'rql/parser';

import { validateRQL } from './validator';

describe('validateRQL', () => {
  describe('when undefined is passed', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(undefined);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/Argument is not valid RQL object/);
      }
    });
  });

  describe('when null is passed', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(null);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/Argument is not valid RQL object/);
      }
    });
  });

  describe('when non-object is passed', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL('hi');
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/Argument is not valid RQL object/);
      }
    });
  });

  describe('when strange object is passed', () => {
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL({ foo: 'bar' });
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/Argument is not valid RQL object/);
      }
    });
  });

  describe('when RQL is passed as an argument to non-RQL operators', () => {
    const rqlString: string = 'gt(foo,and(1,2))';
    let parsedRQL: unknown;
    beforeEach(() => {
      parsedRQL = parseQuery(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(parsedRQL);
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
    let parsedRQL: unknown;
    beforeEach(() => {
      parsedRQL = parseQuery(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(parsedRQL);
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
    let parsedRQL: unknown;
    beforeEach(() => {
      parsedRQL = parseQuery(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(parsedRQL);
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
    let parsedRQL: unknown;
    beforeEach(() => {
      parsedRQL = parseQuery(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(parsedRQL);
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
    let parsedRQL: unknown;
    beforeEach(() => {
      parsedRQL = parseQuery(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(parsedRQL);
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
    let parsedRQL: unknown;
    beforeEach(() => {
      parsedRQL = parseQuery(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(parsedRQL);
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
    let parsedRQL: unknown;
    beforeEach(() => {
      parsedRQL = parseQuery(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(parsedRQL);
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
    let parsedRQL: unknown;
    beforeEach(() => {
      parsedRQL = parseQuery(rqlString);
    });
    it('should throw an error', () => {
      let e: Error | null = null;
      try {
        validateRQL(parsedRQL);
      } catch (err) {
        e = err;
      } finally {
        expect(e).to.not.be.null;
        if (e) expect(e.message).to.match(/requires a string as the first argument/);
      }
    });
  });
});
