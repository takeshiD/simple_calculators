// 式の種類を定義
type ExpressionType = 'number' | 'operator' | 'define' | 'variable';

// 演算子の種類を定義
type Operator = '+';

// 式のインターフェース
interface IExpression {
    type: ExpressionType;
    value: number | string;
}

// 評価結果の型
type EvaluationResult = number | void;

// 式を表現するクラス
class Expression implements IExpression {
    constructor(
        public type: ExpressionType,
        public value: number | string,
    ) {}
}

// 環境（変数のスコープ）を管理するクラス
class Environment {
    private vars: Map<string, number>;
    private parent: Environment | null;

    constructor(parent: Environment | null = null) {
        this.vars = new Map();
        this.parent = parent;
    }

    // 変数の検索
    lookup(name: string): number {
        if (this.vars.has(name)) {
            const value = this.vars.get(name);
            if (value === undefined) {
                throw new Error(`Variable ${name} is undefined`);
            }
            return value;
        }
        if (this.parent) {
            return this.parent.lookup(name);
        }
        throw new Error(`Undefined variable: ${name}`);
    }

    // 変数の定義
    define(name: string, value: number): number {
        this.vars.set(name, value);
        return value;
    }
}

// 計算機本体のクラス
class LambdaCalculator {
    private env: Environment;

    constructor() {
        this.env = new Environment();
    }

    // パーサー
    private parse(input: string): Expression {
        const token = input.trim();

        if (token === '+') {
            return new Expression('operator', '+');
        } else if (token.startsWith('def')) {
            return new Expression('define', token.slice(3));
        } else if (token.startsWith('$')) {
            return new Expression('variable', token.slice(1));
        } else {
            const num = Number(token);
            if (isNaN(num)) {
                throw new Error(`Invalid number: ${token}`);
            }
            return new Expression('number', num);
        }
    }

    // スタックの型を保証するためのヘルパー関数
    private ensureStackNumber(stack: (number | void)[]): number {
        const value = stack.pop();
        if (typeof value !== 'number') {
            throw new Error('Expected a number on the stack');
        }
        return value;
    }

    // 式の評価
    evaluate(expr: string): number {
        const tokens = expr.trim().split(/\s+/);
        const stack: (number | void)[] = [];

        for (const token of tokens) {
            const exp = this.parse(token);

            switch (exp.type) {
                case 'number':
                    if (typeof exp.value === 'number') {
                        stack.push(exp.value);
                    }
                    break;

                case 'operator':
                    if (exp.value === '+') {
                        const b = this.ensureStackNumber(stack);
                        const a = this.ensureStackNumber(stack);
                        stack.push(a + b);
                    }
                    break;

                case 'define':
                    if (typeof exp.value === 'string') {
                        const value = this.ensureStackNumber(stack);
                        stack.push(this.env.define(exp.value, value));
                    }
                    break;

                case 'variable':
                    if (typeof exp.value === 'string') {
                        stack.push(this.env.lookup(exp.value));
                    }
                    break;

                default:
                    throw new Error(`Unknown expression type: ${exp.type}`);
            }
        }

        const result = stack[stack.length - 1];
        if (typeof result !== 'number') {
            throw new Error('Evaluation did not result in a number');
        }
        return result;
    }
}

const calc = new LambdaCalculator();
console.log('5 + 3 =', calc.evaluate('5 3 +')); // 8
console.log('Define x = 10:', calc.evaluate('10 defx')); // 10
console.log('x + 5 =', calc.evaluate('$x 5 +')); // 15
