import type { RuntimeValue } from '../../../types/project';
import type { ExpressionHandler, StatementHandler } from '../types';

export const FUNCTIONS_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  fn_call_stack: ({ sprite, thread, val, findFunctionDef }) => {
    const fnName = String(val('name'));
    const fn = findFunctionDef(sprite, fnName);
    if (fn && fn.body.length > 0) {
      const locals: Record<string, RuntimeValue> = {};
      const args = [val('arg1'), val('arg2')];
      fn.params.forEach((p, idx) => {
        locals[p] = args[idx] ?? 0;
      });
      thread.frames.push({ blocks: fn.body, index: 0, kind: 'function', locals });
    }
    return false;
  },
  fn_return: ({ thread, val }) => {
    const retVal = val('value');
    thread.returnValue = retVal;
    while (thread.frames.length > 0) {
      const popped = thread.frames.pop();
      if (popped?.kind === 'function') break;
    }
    if (thread.frames.length === 0) {
      thread.finished = true;
    }
    return false;
  },
};

export const FUNCTIONS_EXPRESSION_HANDLERS: Record<string, ExpressionHandler> = {
  fn_call_reporter: ({ sprite, depth, val, callCustomFunctionSync }) => {
    const fnName = String(val('name'));
    const arg1 = val('arg1');
    const arg2 = val('arg2');
    return callCustomFunctionSync(sprite, fnName, [arg1, arg2], depth);
  },
};
