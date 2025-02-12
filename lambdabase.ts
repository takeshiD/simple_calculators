// 式の型を定義
type ExpressionType = 'number' | 'symbol' | 'list' | 'boolean';
type SchemeValue = number | boolean | SchemeFunction | null;
type SchemeFunction = (...args: SchemeValue[]) => SchemeValue;

// Scheme式を表現するクラス
class Expression {
  constructor(
    public type: ExpressionType,
    public value: number | string | Expression[] | boolean
  ) {}
}

// 環境（変数のスコープ）を管理するクラス
class Environment {
  private vars: Map<string, SchemeValue>;
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  // 変数の検索
  lookup(name: string): SchemeValue {
    if (this.vars.has(name)) {
      return this.vars.get(name)!;
    }
    if (this.parent) {
      return this.parent.lookup(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  // 変数の定義
  define(name: string, value: SchemeValue): SchemeValue {
    this.vars.set(name, value);
    return value;
  }
}

// トークナイザー
function tokenize(input: string): string[] {
  return input
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .trim()
    .split(/\s+/);
}

// パーサー
function parse(tokens: string[]): Expression {
  if (tokens.length === 0) {
    throw new Error('Unexpected EOF');
  }

  const token = tokens.shift()!;

  if (token === '(') {
    const list: Expression[] = [];
    while (tokens[0] !== ')') {
      if (tokens.length === 0) {
        throw new Error('Missing closing parenthesis');
      }
      list.push(parse(tokens));
    }
    tokens.shift(); // Remove ')'
    return new Expression('list', list);
  }

  if (token === ')') {
    throw new Error('Unexpected closing parenthesis');
  }

  if (token === '#t' || token === '#f') {
    return new Expression('boolean', token === '#t');
  }

  if (!isNaN(Number(token))) {
    return new Expression('number', Number(token));
  }

  return new Expression('symbol', token);
}

// 評価器
function evaluate(expr: Expression, env: Environment): SchemeValue {
  switch (expr.type) {
    case 'number':
      return expr.value as number;

    case 'boolean':
      return expr.value as boolean;

    case 'symbol':
      return env.lookup(expr.value as string);

    case 'list': {
      const list = expr.value as Expression[];
      if (list.length === 0) {
        return null;
      }

      const first = list[0];
      
      // 特殊形式の処理
      if (first.type === 'symbol') {
        switch (first.value) {
          case 'define': {
            const [_, name, value] = list;
            return env.define(
              (name.value as string),
              evaluate(value, env)
            );
          }

          case 'lambda': {
            const [__, params, body] = list;
            return (...args: SchemeValue[]): SchemeValue => {
              const newEnv = new Environment(env);
              (params.value as Expression[]).forEach((param, i) => {
                newEnv.define((param.value as string), args[i]);
              });
              return evaluate(body, newEnv);
            };
          }

          case 'if': {
            const [___, condition, consequent, alternate] = list;
            if (evaluate(condition, env)) {
              return evaluate(consequent, env);
            }
            return evaluate(alternate, env);
          }
        }
      }

      // 関数適用
      const fn = evaluate(first, env) as SchemeFunction;
      const args = list.slice(1).map(arg => evaluate(arg, env));
      return fn(...args);
    }
  }
}

// グローバル環境の初期化
const globalEnv = new Environment();

// 基本的な演算子の定義
globalEnv.define('+', (a: number, b: number): number => a + b);
globalEnv.define('-', (a: number, b: number): number => a - b);
globalEnv.define('*', (a: number, b: number): number => a * b);
globalEnv.define('/', (a: number, b: number): number => a / b);
globalEnv.define('=', (a: number, b: number): boolean => a === b);
globalEnv.define('<', (a: number, b: number): boolean => a < b);
globalEnv.define('>', (a: number, b: number): boolean => a > b);

// インタプリタのメイン関数
function interpret(input: string): SchemeValue {
  const tokens = tokenize(input);
  const ast = parse(tokens);
  return evaluate(ast, globalEnv);
}

// 使用例
console.log(interpret('(+ 1 2)')); // 3
console.log(interpret('(define x 5)')); // 5
console.log(interpret('(* x 2)')); // 10
console.log(interpret(`
  (define factorial
    (lambda (n)
      (if (= n 0)
          1
          (* n (factorial (- n 1))))))
`));
console.log(interpret('(factorial 5)')); // 120

// 論理値のテスト
console.log(interpret('#t')); // true
console.log(interpret('#f')); // false
console.log(interpret('(if #t 1 2)')); // 1
console.log(interpret('(if #f 1 2)')); // 2
