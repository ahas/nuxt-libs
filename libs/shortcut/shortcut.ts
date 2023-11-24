const _modifierKeys = ["CONTROL", "ALT", "SHIFT", "META"];
const _modifierPropMap: Record<(typeof _modifierKeys)[number], keyof KeyboardEvent> = {
  CONTROL: "ctrlKey",
  ALT: "altKey",
  SHIFT: "shiftKey",
  META: "metaKey",
};

export type KeyMap = Record<string, boolean>;
export type KeyCommandListener = (command: KeyCommand) => void;
export type ShortcutEventListener = (event: ShortcutEvent) => void;
export type KeyboardEventListener = (this: Shortcut, event: KeyboardEvent) => void;
export type BlurEventListener = (this: Shortcut, event: Event) => void;
export type ShortcutTarget = Window | Document | Element | undefined;

export enum ShortcutResult {
  Skip = "skip",
  Trigger = "trigger",
  Next = "next",
  Wait = "wait",
}

export class KeyCondition {
  static parse(keyExpression: string): KeyCondition {
    if (!keyExpression) {
      throw new Error("KeyConditionError: Invalid key expression");
    }

    const combinations = keyExpression
      .toUpperCase()
      .split("+")
      .map((x) => x.trim());
    const modifierMap: KeyMap = {};
    const keyMap: KeyMap = {};

    for (const key of combinations) {
      if (Shortcut.isModifier(key)) {
        modifierMap[key] = true;
      } else {
        keyMap[key] = true;
      }
    }

    return new KeyCondition(modifierMap, keyMap);
  }

  readonly modifierMap: KeyMap;
  readonly keyMap: KeyMap;
  readonly size: number;

  constructor(modifierMap: KeyMap, keyMap: KeyMap) {
    this.modifierMap = modifierMap;
    this.keyMap = keyMap;
    this.size = Object.keys(modifierMap).length + Object.keys(keyMap).length;
  }

  matchModifiers(modifierMap: KeyMap): boolean {
    if (Object.keys(this.modifierMap).length != Object.keys(modifierMap).length) {
      return false;
    }

    for (const modifier in this.modifierMap) {
      if (!modifierMap[modifier]) {
        return false;
      }
    }

    return true;
  }

  matchKeys(keyMap: KeyMap): boolean {
    if (Object.keys(this.keyMap).length != Object.keys(keyMap).length) {
      return false;
    }

    for (const key in this.keyMap) {
      if (!keyMap[key]) {
        return false;
      }
    }

    return true;
  }

  containsKey(keyMap: KeyMap): boolean {
    if (Object.keys(keyMap).length >= Object.keys(this.keyMap).length) {
      return false;
    }

    for (const key in keyMap) {
      if (!this.keyMap[key]) {
        return false;
      }
    }

    return true;
  }
}

export class KeyCommand {
  static parse(command: string): KeyCondition[] {
    const expressions = command.split(",");
    const conditions: KeyCondition[] = [];

    for (const expression of expressions) {
      const keyCondition = KeyCondition.parse(expression);
      conditions.push(keyCondition);
    }

    return conditions;
  }

  readonly expression: string;
  readonly listener: KeyCommandListener;
  readonly conditions: KeyCondition[];
  readonly size: number;

  private _activeCondition: KeyCondition;
  private _conditionIndex = 0;

  get activeCondition(): KeyCondition {
    return this._activeCondition;
  }

  get conditionIndex(): number {
    return this._conditionIndex;
  }

  constructor(expression: string, listener: KeyCommandListener) {
    this.expression = expression;
    this.listener = listener;
    this.conditions = KeyCommand.parse(expression);
    this.size = this.conditions.reduce((a, b) => a + b.size, 0);
    this._activeCondition = this.conditions[0];
  }

  next(): void {
    this._conditionIndex++;
    this._activeCondition = this.conditions[this._conditionIndex];
  }

  reset(): void {
    this._conditionIndex = 0;
    this._activeCondition = this.conditions[0];
  }

  trigger(): void {
    this.listener(this);
  }

  match(shortcut: Shortcut): ShortcutResult {
    const condition = this._activeCondition;
    const modifierMatched = condition.matchModifiers(shortcut.activeModifierMap);

    if (!modifierMatched) {
      return ShortcutResult.Skip;
    }

    if (condition.matchKeys(shortcut.activeKeyMap)) {
      this.next();

      if (this._conditionIndex >= this.conditions.length) {
        this.reset();
        this.trigger();
        return ShortcutResult.Trigger;
      }

      shortcut.activeKeyMap = {};
      return ShortcutResult.Next;
    } else if (condition.containsKey(shortcut.activeKeyMap)) {
      return ShortcutResult.Wait;
    }

    this.reset();

    return ShortcutResult.Skip;
  }
}

export interface ShortcutOptions {
  target?: Window | Document | Element;
}

export class ShortcutEvent {
  readonly shortcut: Shortcut;
  readonly result: ShortcutResult;
  readonly lastResult: ShortcutResult;
  readonly originalEvent: KeyboardEvent;

  constructor(shortcut: Shortcut, originalEvent: KeyboardEvent) {
    this.shortcut = shortcut;
    this.result = shortcut.result;
    this.lastResult = shortcut.lastResult;
    this.originalEvent = originalEvent;
  }
}

export class Shortcut {
  static isModifier(key: string): boolean {
    return _modifierKeys.includes(key.toUpperCase());
  }

  static isKey(key: string): boolean {
    return !_modifierKeys.includes(key.toUpperCase());
  }

  target: ShortcutTarget;
  commands: KeyCommand[] = [];
  defaultListeners: ShortcutEventListener[] = [];
  activeModifierMap: KeyMap = {};
  activeKeyMap: KeyMap = {};
  pressedModifierMap: KeyMap = {};
  pressedKeyMap: KeyMap = {};

  private _result = ShortcutResult.Skip;
  private _lastResult = ShortcutResult.Skip;
  private _keyDownListener: KeyboardEventListener;
  private _keyUpListener: KeyboardEventListener;
  private _blurListener: BlurEventListener;

  get result(): ShortcutResult {
    return this._result;
  }

  get lastResult(): ShortcutResult {
    return this._lastResult;
  }

  constructor(options?: ShortcutOptions) {
    options ??= {};
    this.target ??= typeof window === "undefined" ? undefined : window;
    this._keyDownListener = this._onKeyDown.bind(this);
    this._keyUpListener = this._onKeyUp.bind(this);
    this._blurListener = this._onBlur.bind(this);
  }

  activate(): void {
    if (this.target) {
      this.target.addEventListener("keydown", this._keyDownListener as any);
      this.target.addEventListener("keyup", this._keyUpListener as any);
      this.target.addEventListener("blur", this._blurListener as any);
    }
  }

  deactivate(): void {
    if (this.target) {
      this.target.removeEventListener("keydown", this._keyDownListener as any);
      this.target.removeEventListener("keyup", this._keyUpListener as any);
      this.target.removeEventListener("blur", this._onBlur as any);
    }
  }

  reset(): void {
    this.activeModifierMap = {};
    this.activeKeyMap = {};

    for (const command of this.commands) {
      command.reset();
    }
  }

  on(listener: ShortcutEventListener): this;
  on(expression: string, listener: KeyCommandListener): this;
  on(...args: any[]): this {
    if (args.length === 2) {
      const command = new KeyCommand(args[0], args[1]);
      this.commands.push(command);
      this.commands.sort((a, b) => b.size - a.size);
    } else {
      this.defaultListeners.push(args[0]);
    }

    return this;
  }

  removeAllListeners() {
    this.defaultListeners.length = 0;
    this.commands.length = 0;
  }

  destroy(): void {
    this.deactivate();
    this.removeAllListeners();
  }

  isAnyModifierPressed(): boolean {
    const modifiers = Object.values(this.activeModifierMap);
    return !!modifiers.length && !modifiers.every((x) => !x);
  }

  isAnyKeyPressed(): boolean {
    const keys = Object.values(this.activeKeyMap);
    return !!keys.length && !keys.every((x) => !x);
  }

  private _updateModifier(event: KeyboardEvent): void {
    for (const modKey in _modifierPropMap) {
      const pressed = event[_modifierPropMap[modKey]] as boolean;

      if (pressed) {
        this.pressedModifierMap[modKey] = pressed;
        this.activeModifierMap[modKey] = pressed;
      } else {
        delete this.pressedModifierMap[modKey];
        delete this.activeModifierMap[modKey];
      }
    }
  }

  private _onKeyDown(event: KeyboardEvent): void {
    if (event.repeat) {
      return;
    }

    this._updateModifier(event);

    const key = event.key.toUpperCase();
    this._lastResult = this._result;
    this._result = ShortcutResult.Skip;

    if (Shortcut.isModifier(key)) {
      this.activeKeyMap = {};
      this._result = ShortcutResult.Skip;
      return;
    }

    if (this.pressedKeyMap[key]) {
      return;
    }

    this.pressedKeyMap[key] = true;
    this.activeKeyMap[key] = true;

    for (const command of this.commands) {
      this._result = command.match(this);

      if (this._result !== ShortcutResult.Skip) {
        event.preventDefault();
        break;
      }
    }

    if (this._result === ShortcutResult.Trigger) {
      this.activeKeyMap = {};
    } else {
      const shortcutEvent = new ShortcutEvent(this, event);

      for (const listener of this.defaultListeners) {
        listener(shortcutEvent);
      }
    }
  }

  private _onBlur(event: Event) {
    this.pressedModifierMap = {};
    this.pressedKeyMap = {};
    this.activeModifierMap = {};
    this.activeKeyMap = {};
  }

  private _onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toUpperCase();

    this._updateModifier(event);

    if (Shortcut.isModifier(key)) {
      delete this.pressedModifierMap[key];
      delete this.activeModifierMap[key];
      this.activeKeyMap = {};
    } else {
      delete this.pressedKeyMap[key];
      delete this.activeKeyMap[key];
    }
  }
}
