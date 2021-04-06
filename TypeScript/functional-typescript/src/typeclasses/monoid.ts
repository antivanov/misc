import { Semigroup, SemigroupInstances, StringSemigroup, NumberAdditionSemigroup } from './semigroup';

export interface Monoid<T> extends Semigroup<T> {
  unit: T
}

class StringMonoid extends StringSemigroup {
  unit = ''
}
const stringMonoid: Monoid<string> = new StringMonoid();

class NumberAdditionMonoid extends NumberAdditionSemigroup {
  unit = 0
}
const numberAdditionMonoid: Monoid<number> = new NumberAdditionMonoid();

const numberMultiplicationMonoid: Monoid<number> = {
  ...SemigroupInstances.numberMultiplicationSemigroup,
  unit: 1
};

export function combineAll<T>(xs: Array<T>) {
  return (m: Monoid<T>) =>
    xs.reduce((acc, cur) =>
      m.combine(acc, cur)
    , m.unit);
}

export const MonoidInstances = {
  stringMonoid,
  numberAdditionMonoid,
  numberMultiplicationMonoid
};

