class StackCalculator {
    stack: Array<number>;
    variables: Map<string, number>;
    constructor() {
        this.stack = [];
        this.variables = new Map();
    }
    // スタック操作
    push(value: number) {
        this.stack.push(value);
    }
    pop(): number | undefined {
        if (this.stack.length === 0) {
            throw new Error('Stack is empty');
        }
        return this.stack.pop();
    }
    // 命令セット
    add() {
        const b: number | undefined = this.pop();
        const a: number | undefined = this.pop();
        if (a === undefined || b == undefined) {
            throw new Error('Stack is empty');
        }
        this.push(a + b);
    }
    defineVariable(name: string) {
        const value: number | undefined = this.pop();
        if (value === undefined) {
            throw new Error('Stack is empty');
        }
        this.variables.set(name, value);
    }
    loadVariable(name: string) {
        if (!this.variables.has(name)) {
            throw new Error(`Undefined variable: ${name}`);
        }
        const val = this.variables.get(name)
        if(val === undefined) {
            throw new Error('Variable exists but value is undefined')
        }
        this.push(val);
    }
    // 式の評価
    evaluate(expr: string): number {
        const tokens: string[] = expr.trim().split(/\s+/);
        for (const token of tokens) {
            if (token === '+') {
                this.add();
            } else if (token.startsWith('def')) {
                const varName = token.slice(3);
                this.defineVariable(varName);
            } else if (token.startsWith('$')) {
                this.loadVariable(token.slice(1));
            } else {
                this.push(Number(token));
            }
        }
        return this.stack[this.stack.length - 1];
    }
}

const stackcalc = new StackCalculator();
console.log(stackcalc.evaluate('5 3 +'));
console.log(stackcalc.evaluate('10 defx'));
console.log(stackcalc.evaluate('$x 5 +'));
