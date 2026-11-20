import { toNumber, type ExpressionHandler, type StatementHandler } from '../types';

export const DATA_STATEMENT_HANDLERS: Record<string, StatementHandler> = {
  data_set_global: ({ host, val }) => {
    host.setGlobal(String(val('name')), val('value'));
    return false;
  },
  data_change_global: ({ host, val }) => {
    const name = String(val('name'));
    const curr = toNumber(host.getGlobal(name));
    host.setGlobal(name, curr + toNumber(val('delta')));
    return false;
  },
  data_let_local: ({ thread, val, setLocal }) => {
    setLocal(thread.frames, String(val('name')), val('value'));
    return false;
  },
  data_array_push: ({ host, thread, val, lookupLocal, setLocal }) => {
    const name = String(val('name'));
    const item = val('value');
    const loc = lookupLocal(thread.frames, name);
    const existing = loc.found ? loc.value : host.getGlobal(name);
    const arr = Array.isArray(existing) ? [...existing, item] : [item];
    if (loc.found) setLocal(thread.frames, name, arr);
    else host.setGlobal(name, arr);
    return false;
  },
  data_dict_set: ({ host, thread, val, lookupLocal, setLocal }) => {
    const name = String(val('name'));
    const key = String(val('key'));
    const value = val('value');
    const loc = lookupLocal(thread.frames, name);
    const existing = loc.found ? loc.value : host.getGlobal(name);
    const dict =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...existing, [key]: value }
        : { [key]: value };
    if (loc.found) setLocal(thread.frames, name, dict);
    else host.setGlobal(name, dict);
    return false;
  },
};

export const DATA_EXPRESSION_HANDLERS: Record<string, ExpressionHandler> = {
  data_get_var: ({ host, frames, val, lookupLocal }) => {
    const name = String(val('name'));
    const loc = lookupLocal(frames, name);
    if (loc.found) return loc.value;
    return host.getGlobal(name);
  },
  data_array_get: ({ host, frames, val, lookupLocal }) => {
    const name = String(val('name'));
    const idx = Math.floor(toNumber(val('index')));
    const loc = lookupLocal(frames, name);
    const arr = loc.found ? loc.value : host.getGlobal(name);
    if (Array.isArray(arr) && idx >= 0 && idx < arr.length) {
      return arr[idx];
    }
    return 0;
  },
  data_dict_get: ({ host, frames, val, lookupLocal }) => {
    const name = String(val('name'));
    const key = String(val('key'));
    const loc = lookupLocal(frames, name);
    const dict = loc.found ? loc.value : host.getGlobal(name);
    if (dict && typeof dict === 'object' && !Array.isArray(dict)) {
      return dict[key] ?? 0;
    }
    return 0;
  },
};
