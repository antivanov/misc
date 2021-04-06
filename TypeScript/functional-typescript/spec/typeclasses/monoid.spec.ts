import { expect } from 'chai';
import { test, Test } from 'mocha';

import { Monoid, MonoidInstances, combineAll } from '../../src/typeclasses/monoid';

describe('monoid', () => {

  describe('combineAll', () => {

    describe('for stringMonoid', () => {
      it('should combine all the strings in the list', () => {
        const inputs = ['a', 'bc', 'def', 'ghjk', '.'];
        const expected = inputs.join('');
        expect(combineAll(inputs)(MonoidInstances.stringMonoid)).to.eql(expected);
      });
    });

    describe('for custom class - more real-life example', () => {

      class TestRunStats {
        constructor(readonly success: number, readonly failed: number, readonly ignored: number) {
        }
      }

      const testRunStatsMonoid: Monoid<TestRunStats> = {
        combine(x: TestRunStats, y: TestRunStats): TestRunStats {
          return new TestRunStats(x.success + y.success, x.failed + y.failed, x.ignored + y.ignored)
        },
        unit: new TestRunStats(0, 0, 0)
      };

      it('should combine custom classes', () => {
        const inputs = [
          new TestRunStats(1, 1, 3),
          new TestRunStats(1, 4, 1),
          new TestRunStats(5, 1, 1),
        ];
        const expected = new TestRunStats(7, 6, 5);
        expect(combineAll(inputs)(testRunStatsMonoid)).to.eql(expected);
      });
    });
  })

  describe('monoid laws', () => {

    function checkMonoidLaws<T>(m: Monoid<T>, x: T, y: T, z: T): void {
      checkAssociativityLaw(m, x, y, z);
      checkIdentityLaw(m, x);
    }

    function checkAssociativityLaw<T>(m: Monoid<T>, x: T, y: T, z: T): void {
      expect(
        m.combine(m.combine(x, y), z),
        `associativity law for ${m.constructor.name}`
      ).to.eql(
        m.combine(x, m.combine(y, z))
      );
    }

    function checkIdentityLaw<T>(m: Monoid<T>, x: T): void {
      expect(
        m.combine(m.unit, x),
        `left identity law for ${m.constructor.name}`
      ).to.eql(
        x
      );
      expect(
        m.combine(x, m.unit),
        `right identity law for ${m.constructor.name}`
      ).to.eql(
        x
      );
    }

    it('combine should be associative', () => {
      checkMonoidLaws(MonoidInstances.stringMonoid, 'a', 'bc', 'def');
      checkMonoidLaws(MonoidInstances.numberAdditionMonoid, -4, 2, 3);
      checkMonoidLaws(MonoidInstances.numberMultiplicationMonoid, 1, 2, 4);
    });
  });
});