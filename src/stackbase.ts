type Instruction = 
  | { type: 'PUSH'; value: number }
  | { type: 'ADD' }
  | { type: 'STORE'; name: string }
  | { type: 'LOAD'; name: string };

// スタックの要素の型を定義
type StackElement = number;

// エラー型の定義
class CalculatorError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CalculatorError';
    }
}

// スタックマシンの実装
class StackCalculator {
  private stack: StackElement[];
  private variables: Map<string, StackElement>;

  constructor() {
    this.stack = [];
    this.variables = new Map();
  }

  // スタック操作の基本メソッド
  private push(value: StackElement): void {
    this.stack.push(value);
  }

  private pop(): StackElement {
    if (this.stack.length === 0) {
      throw new CalculatorError('Stack underflow: Cannot pop from empty stack');
    }
    const value = this.stack.pop();
    if (value === undefined) {
      throw new CalculatorError('Stack error: Undefined value popped');
    }
    return value;
  }

  // スタックの現在の状態を取得
  private getStackState(): StackElement[] {
    return [...this.stack];
  }

  // 命令を実行
  private executeInstruction(instruction: Instruction): void {
    switch (instruction.type) {
      case 'PUSH':
        this.push(instruction.value);
        break;

      case 'ADD': {
        const b = this.pop();
        const a = this.pop();
        this.push(a + b);
        break;
      }

      case 'STORE': {
        const value = this.pop();
        this.variables.set(instruction.name, value);
        this.push(value); // 値をスタックに戻す
        break;
      }

      case 'LOAD': {
        const value = this.variables.get(instruction.name);
        if (value === undefined) {
          throw new CalculatorError(`Undefined variable: ${instruction.name}`);
        }
        this.push(value);
        break;
      }
      default:
        const _exhaustiveCheck: never = instruction;
        throw new CalculatorError(`Unknown instruction type: ${JSON.stringify(instruction)}`);
    }
  }

  // トークンをパースして命令に変換
  private parseToken(token: string): Instruction {
    if (token === '+') {
      return { type: 'ADD' };
    } else if (token.startsWith('def')) {
      return { type: 'STORE', name: token.slice(3) };
    } else if (token.startsWith('$')) {
      return { type: 'LOAD', name: token.slice(1) };
    } else {
      const value = Number(token);
      if (isNaN(value)) {
        throw new CalculatorError(`Invalid number: ${token}`);
      }
      return { type: 'PUSH', value };
    }
  }

  // 式を評価
  evaluate(expr: string): number {
    // 初期状態を保存
    const initialStackState = this.getStackState();

    try {
      // 式を空白で分割してトークンに分解
      const tokens = expr.trim().split(/\s+/);
      
      // 各トークンを処理
      for (const token of tokens) {
        const instruction = this.parseToken(token);
        this.executeInstruction(instruction);
      }

      // 結果を取得
      if (this.stack.length === 0) {
        throw new CalculatorError('No result: Stack is empty after evaluation');
      }

      return this.stack[this.stack.length - 1];

    } catch (error) {
      // エラーが発生した場合はスタックを初期状態に戻す
      this.stack = initialStackState;
      throw error;
    }
  }

  // デバッグ用のメソッド
    debug(): {
        stack: StackElement[];
        variables: Record<string, StackElement>;
    } {
        return {
            stack: this.getStackState(),
            variables: Object.fromEntries(this.variables),
        };
    }
}
const calc = new StackCalculator();
console.log('5 3 + =', calc.evaluate('5 3 +')); // 8
console.log('Define x = 10:', calc.evaluate('10 defx')); // 10
console.log('x + 5 =', calc.evaluate('$x 5 +')); // 15
