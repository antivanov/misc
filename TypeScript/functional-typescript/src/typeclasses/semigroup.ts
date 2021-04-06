export interface Semigroup<T> {
  combine(x: T, y: T): T
}

export class StringSemigroup implements Semigroup<String> {
  combine(x: string, y: string): string {
    return x.concat(y);
  }
};
const stringSemigroup: Semigroup<string> = new StringSemigroup();

export class NumberAdditionSemigroup implements Semigroup<number> {
  combine(x: number, y: number): number {
    return x + y;
  }
};
const numberAdditionSemigroup: Semigroup<number> = new NumberAdditionSemigroup();

// Not actually required to define a class per typeclass instance
const numberMultiplicationSemigroup: Semigroup<number> = {
  combine: function(x: number, y: number): number {
    return x * y;
  }
};

export const SemigroupInstances = {
  stringSemigroup,
  numberAdditionSemigroup,
  numberMultiplicationSemigroup
};