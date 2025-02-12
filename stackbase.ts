// 命令型を表現するenum
enum InstructionType {
  PUSH = "PUSH",
  POP = "POP",
  LOAD = "LOAD",
  STORE = "STORE",
  JUMP = "JUMP",
  JUMP_IF_FALSE = "JUMP_IF_FALSE",
  CALL = "CALL",
  RETURN = "RETURN",
  ADD = "ADD",
  SUB = "SUB",
  MUL = "MUL",
  DIV = "DIV",
  EQ = "EQ",
  LT = "LT",
  GT = "GT",
  HALT = "HALT",
  NOP = "NOP",
}

// 式の種類を表現するenum
enum ExpressionType {
  NUMBER = "number",
  SYMBOL = "symbol",
  LIST = "list",
  CLOSURE = "closure",
}

// 命令のインターフェース
interface Instruction {
  op: InstructionType;
  value?: any;
  name?: string;
  address?: number;
  argCount?: number;
}

// 式を表現するクラス
class Expression {
  constructor(
    public readonly type: ExpressionType,
    public readonly value: any,
  ) {}
}

// 環境（変数のスコープ）を管理するクラス
class Environment {
  private vars: Map<string, any>;

  constructor(private parent: Environment | null = null) {
    this.vars = new Map();
  }

  lookup(name: string): any {
    if (this.vars.has(name)) {
      return this.vars.get(name);
    }
    if (this.parent) {
      return this.parent.lookup(name);
    }
    throw new Error(`Undefined variable: '${name}'`);
  }

  define(name: string, value: any): any {
    this.vars.set(name, value);
    return value;
  }
}

// スタックマシンを実装するクラス
class StackMachine {
  private stack: any[];
  private env: Environment;
  private code: Instruction[];
  private pc: number; // プログラムカウンタ

  constructor() {
    this.stack = [];
    this.env = new Environment();
    this.code = [];
    this.pc = 0;
  }

  // スタック操作
  private push(value: any): void {
    this.stack.push(value);
  }

  private pop(): any {
    if (this.stack.length === 0) {
      throw new Error("Stack underflow");
    }
    return this.stack.pop();
  }

  // 命令を実行
  private step(): boolean {
    if (this.pc >= this.code.length) {
      return false;
    }

    const inst = this.code[this.pc++];
    switch (inst.op) {
      case InstructionType.PUSH:
        this.push(inst.value);
        break;

      case InstructionType.POP:
        this.pop();
        break;

      case InstructionType.LOAD:
        if (inst.name) {
          const value = this.env.lookup(inst.name);
          this.push(value);
        }
        break;

      case InstructionType.STORE:
        if (inst.name) {
          const val = this.pop();
          this.env.define(inst.name, val);
        }
        break;

      case InstructionType.JUMP:
        if (typeof inst.address === "number") {
          this.pc = inst.address;
        }
        break;

      case InstructionType.JUMP_IF_FALSE:
        const cond = this.pop();
        if (!cond && typeof inst.address === "number") {
          this.pc = inst.address;
        }
        break;

      case InstructionType.CALL:
        const closure = this.pop();
        if (
          typeof closure === "function" && typeof inst.argCount === "number"
        ) {
          const args: any[] = [];
          for (let i = 0; i < inst.argCount; i++) {
            args.unshift(this.pop());
          }
          const result = closure(...args);
          this.push(result);
        } else {
          throw new Error("Not a function");
        }
        break;

      case InstructionType.RETURN:
        return false;

      case InstructionType.ADD: {
        const b = this.pop();
        const a = this.pop();
        this.push(a + b);
        break;
      }

      case InstructionType.SUB: {
        const b = this.pop();
        const a = this.pop();
        this.push(a - b);
        break;
      }

      case InstructionType.MUL: {
        const b = this.pop();
        const a = this.pop();
        this.push(a * b);
        break;
      }

      case InstructionType.DIV: {
        const b = this.pop();
        const a = this.pop();
        this.push(a / b);
        break;
      }

      case InstructionType.EQ: {
        const b = this.pop();
        const a = this.pop();
        this.push(a === b);
        break;
      }

      case InstructionType.LT: {
        const b = this.pop();
        const a = this.pop();
        this.push(a < b);
        break;
      }

      case InstructionType.GT: {
        const b = this.pop();
        const a = this.pop();
        this.push(a > b);
        break;
      }

      case InstructionType.NOP:
        break;

      case InstructionType.HALT:
        return false;
    }

    return true;
  }

  // プログラムを実行
  run(): any {
    while (this.step()) {}
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  // 環境とコードをセット
  setEnvironment(env: Environment): void {
    this.env = env;
  }

  setCode(code: Instruction[]): void {
    this.code = code;
  }
}

// コンパイラ
class Compiler {
  private code: Instruction[];
  private labelCounter: number;

  constructor() {
    this.code = [];
    this.labelCounter = 0;
  }

  // 新しいラベルを生成
  private newLabel(): number {
    return this.labelCounter++;
  }

  // 命令を追加
  private emit(op: InstructionType, args: Partial<Instruction> = {}): void {
    this.code.push({ op, ...args });
  }

  // 式をコンパイル
  compile(expr: Expression): void {
    switch (expr.type) {
      case ExpressionType.NUMBER:
        this.emit(InstructionType.PUSH, { value: expr.value });
        break;

      case ExpressionType.SYMBOL:
        this.emit(InstructionType.LOAD, { name: expr.value });
        break;

      case ExpressionType.LIST:
        if (expr.value.length === 0) {
          this.emit(InstructionType.PUSH, { value: null });
          return;
        }

        const [first, ...rest] = expr.value;

        // 特殊形式の処理
        if (first.type === ExpressionType.SYMBOL) {
          switch (first.value) {
            case "define": {
              const [name, value] = rest;
              this.compile(value);
              this.emit(InstructionType.STORE, { name: name.value });
              return;
            }

            case "if": {
              const [condition, consequent, alternate] = rest;
              const elseLabel = this.newLabel();
              const endLabel = this.newLabel();

              this.compile(condition);
              this.emit(InstructionType.JUMP_IF_FALSE, { address: elseLabel });
              this.compile(consequent);
              this.emit(InstructionType.JUMP, { address: endLabel });
              this.code[elseLabel] = { op: InstructionType.NOP };
              this.compile(alternate);
              this.code[endLabel] = { op: InstructionType.NOP };
              return;
            }

            case "lambda": {
              const [params, body] = rest;
              // ラムダ式の処理（クロージャの作成）
              this.emit(InstructionType.PUSH, {
                value: function (...args: any[]) {
                  const newEnv = new Environment(this.env);
                  params.value.forEach((param: Expression, i: number) => {
                    newEnv.define(param.value, args[i]);
                  });
                  return evaluate(body, newEnv);
                },
              });
              return;
            }
          }
        }

        // 関数適用
        rest.forEach((arg) => this.compile(arg));
        this.compile(first);
        this.emit(InstructionType.CALL, { argCount: rest.length });
    }
  }

  getCode(): Instruction[] {
    return this.code;
  }
}

// トークナイザー
function tokenize(input: string): string[] {
  return input
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .trim()
    .split(/\s+/);
}

// パーサー
function parse(tokens: string[]): Expression {
  if (tokens.length === 0) {
    throw new Error("Unexpected EOF");
  }

  const token = tokens.shift()!;

  if (token === "(") {
    const list: Expression[] = [];
    while (tokens[0] !== ")") {
      if (tokens.length === 0) {
        throw new Error("Missing closing parenthesis");
      }
      list.push(parse(tokens));
    }
    tokens.shift(); // Remove ')'
    return new Expression(ExpressionType.LIST, list);
  }

  if (token === ")") {
    throw new Error("Unexpected closing parenthesis");
  }

  if (!isNaN(Number(token))) {
    return new Expression(ExpressionType.NUMBER, Number(token));
  }

  return new Expression(ExpressionType.SYMBOL, token);
}

// インタプリタのメイン関数
function interpret(input: string): any {
  const tokens = tokenize(input);
  const ast = parse(tokens);

  const compiler = new Compiler();
  compiler.compile(ast);

  const machine = new StackMachine();
  machine.setCode(compiler.getCode());
  machine.setEnvironment(initializeGlobalEnv());

  return machine.run();
}

// グローバル環境の初期化
function initializeGlobalEnv(): Environment {
  const env = new Environment();

  // 基本的な演算子の定義
  env.define("+", (a: number, b: number) => a + b);
  env.define("-", (a: number, b: number) => a - b);
  env.define("*", (a: number, b: number) => a * b);
  env.define("/", (a: number, b: number) => a / b);
  env.define("=", (a: any, b: any) => a === b);
  env.define("<", (a: number, b: number) => a < b);
  env.define(">", (a: number, b: number) => a > b);

  return env;
}

// テスト用のコード
console.log(interpret("(+ 1 2)")); // 3
console.log(interpret("(define x 5)")); // 5
console.log(interpret("(* x 2)")); // 10
console.log(interpret(`
  (define factorial
    (lambda (n)
      (if (= n 0)
          1
          (* n (factorial (- n 1))))))
`));
console.log(interpret("(factorial 5)")); // 120
