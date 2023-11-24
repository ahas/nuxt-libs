import { createDefaultPlatform, type Platform } from "../platform/platform";

const _modifierMap: Record<string, string> = {
  // Control
  CONTROL: "Control",
  CTRL: "Control",
  // Shift
  SHIFT: "Shift",
  // Alt
  ALT: "Alt",
  OPT: "Alt",
  OPTION: "Alt",
  // Meta
  META: "Meta",
  WIN: "Meta",
  CMD: "Meta",
};

const _keyAliasMap: Record<string, string> = {
  SPACE: " ",
  SP: " ",
  CM: "ContextMenu",
  ESC: "Escape",
  INS: "Insert",
  DEL: "Delete",
  SCRLK: "ScrollLock",
  NUMLK: "NumLock",
  EXEC: "Execute",
  BS: "Backspace",
  CAPS: "CapsLock",
  AU: "ArrowUp",
  AR: "ArrowRight",
  AD: "ArrowDown",
  AL: "ArrowLeft",
  PU: "PageUp",
  PD: "PageDown",
  VU: "AudioVolumnUp",
  VD: "AudioVolumnDown",
  MUTE: "AudioVolumnMute",
};

const _modifierPropMap: Record<string, keyof KeyboardEvent> = {
  Control: "ctrlKey",
  Alt: "altKey",
  Shift: "shiftKey",
  Meta: "metaKey",
};

const _labelSymbolMap: Record<string, string> = {
  Meta: "⌘",
  Control: "⌃",
  Alt: "⌥",
  Shift: "⇧",
  Enter: "↩",
  CapsLock: "⇪",
  " ": "␣",
  Escape: "⎋",
  ArrowUp: "↑",
  ArrowRight: "→",
  ArrowDown: "↓",
  ArrowLeft: "←",
  AudioVolumnUp: "🔊",
  AudioVolumnDown: "🔉",
  AudioVolumnMute: "🔈",
};

const _labelAliasMap: Record<string, string> = {
  Control: "Ctrl",
  Delete: "Del",
  Insert: "Ins",
  Escape: "ESC",
  ArrowUp: "UpArrow",
  ArrowRight: "RightArrow",
  ArrowDown: "DownArrow",
  ArrowLeft: "LeftArrow",
};

const _sortedModifiers = ["Control", "Meta", "Shift", "Alt"];

export type KeyMap = Record<string, boolean>;
export type ShortcutDefaultEventListener = (event: ShortcutEvent) => void;
export type ShortcutCommandListener = (event: CommandEvent) => void;
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
  static parse(shortcut: Shortcut, keyExpression: string): KeyCondition {
    if (!keyExpression) {
      throw new Error("KeyConditionError: Invalid key expression");
    }

    const keys = keyExpression
      .toUpperCase()
      .split("+")
      .map((x) => x.trim());
    const modifierMap: KeyMap = {};
    const keyMap: KeyMap = {};
    const hasShift = keys.includes("SHIFT");
    const macLike = shortcut.platform.macLike;

    for (const k of keys) {
      if (k === "COMMANDORCONTROL" || k === "CMDORCTRL") {
        modifierMap[macLike ? "Meta" : "Control"] = true;
      } else if (k in _modifierMap) {
        modifierMap[_modifierMap[k]] = true;
      } else if (k in _keyAliasMap) {
        keyMap[_keyAliasMap[k]] = true;
      } else {
        keyMap[hasShift ? k : k.toLowerCase()] = true;
      }
    }

    return new KeyCondition(shortcut, modifierMap, keyMap);
  }

  readonly shortcut: Shortcut;
  readonly modifierMap: KeyMap;
  readonly keyMap: KeyMap;
  readonly size: number;
  readonly aliases: string[];
  readonly label: string;

  constructor(shortcut: Shortcut, modifierMap: KeyMap, keyMap: KeyMap) {
    this.shortcut = shortcut;
    this.modifierMap = modifierMap;
    this.keyMap = keyMap;
    this.size = Object.keys(modifierMap).length + Object.keys(keyMap).length;
    this.aliases = this.createAliases();

    if (shortcut.platform.macLike) {
      this.label = this.aliases.join(" ");
    } else {
      this.label = this.aliases.join("+");
    }
  }

  createAliases(): string[] {
    const aliases: string[] = [];
    const macLike = this.shortcut.platform.macLike;

    if (macLike) {
      for (const m of _sortedModifiers) {
        if (this.modifierMap[m]) {
          aliases.push(_labelSymbolMap[m] ?? _labelAliasMap[m] ?? m);
        }
      }

      for (const k in this.keyMap) {
        const key = _labelSymbolMap[k] ?? _labelAliasMap[k] ?? k;
        aliases.push(key.length === 1 ? key.toUpperCase() : key);
      }
    } else {
      for (const m of _sortedModifiers) {
        if (this.modifierMap[m]) {
          aliases.push(_labelAliasMap[m] ?? m);
        }
      }

      for (const k in this.keyMap) {
        const key = _labelAliasMap[k] ?? k;
        aliases.push(key.length === 1 ? key.toUpperCase() : key);
      }
    }

    return aliases;
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
  static parse(shortcut: Shortcut, command: string): KeyCondition[] {
    const expressions = command.split(",");
    const conditions: KeyCondition[] = [];

    for (const expression of expressions) {
      const keyCondition = KeyCondition.parse(shortcut, expression);
      conditions.push(keyCondition);
    }

    return conditions;
  }

  readonly shortcut: Shortcut;
  readonly expression: string;
  readonly listener: ShortcutCommandListener;
  readonly conditions: KeyCondition[];
  readonly size: number;
  readonly label: string;

  private _activeCondition: KeyCondition;
  private _conditionIndex = 0;

  get activeCondition(): KeyCondition {
    return this._activeCondition;
  }

  get conditionIndex(): number {
    return this._conditionIndex;
  }

  constructor(
    shortcut: Shortcut,
    expression: string,
    listener: ShortcutCommandListener
  ) {
    this.shortcut = shortcut;
    this.expression = expression;
    this.listener = listener;
    this.conditions = KeyCommand.parse(shortcut, expression);
    this.size = this.conditions.reduce((a, b) => a + b.size, 0);
    this._activeCondition = this.conditions[0];
    this.label = this.createLabel();
  }

  createLabel(): string {
    const exprs: string[] = [];

    for (const condition of this.conditions) {
      exprs.push(condition.label);
    }

    return exprs.join(", ");
  }

  next(): void {
    this._conditionIndex++;
    this._activeCondition = this.conditions[this._conditionIndex];
  }

  reset(): void {
    this._conditionIndex = 0;
    this._activeCondition = this.conditions[0];
  }

  trigger(event: KeyboardEvent): void {
    this.listener(new CommandEvent(this, event));
  }

  match(event: KeyboardEvent): ShortcutResult {
    const condition = this._activeCondition;
    const modifierMatched = condition.matchModifiers(this.shortcut.activeModifierMap);

    if (!modifierMatched) {
      return ShortcutResult.Skip;
    }

    if (condition.matchKeys(this.shortcut.activeKeyMap)) {
      this.next();

      if (this._conditionIndex >= this.conditions.length) {
        this.reset();
        this.trigger(event);
        return ShortcutResult.Trigger;
      }

      this.shortcut.activeKeyMap = {};
      return ShortcutResult.Next;
    } else if (condition.containsKey(this.shortcut.activeKeyMap)) {
      return ShortcutResult.Wait;
    }

    this.reset();

    return ShortcutResult.Skip;
  }
}

export interface ShortcutOptions {
  platform?: Partial<Platform>;
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

export class CommandEvent extends ShortcutEvent {
  readonly command: KeyCommand;

  constructor(command: KeyCommand, originalEvent: KeyboardEvent) {
    super(command.shortcut, originalEvent);
    this.command = command;
  }
}

export class Shortcut {
  static isModifier(key: string): boolean {
    return key.toUpperCase() in _modifierMap;
  }

  static isKey(key: string): boolean {
    return !(key.toUpperCase() in _modifierMap);
  }

  readonly platform: Platform;

  target: ShortcutTarget;
  commands: KeyCommand[] = [];
  defaultListeners: ShortcutDefaultEventListener[] = [];
  activeModifierMap: KeyMap = {};
  activeKeyMap: KeyMap = {};
  pressedModifierMap: KeyMap = {};
  pressedKeyMap: KeyMap = {};

  private _result: ShortcutResult = ShortcutResult.Skip;
  private _lastResult: ShortcutResult = ShortcutResult.Skip;
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
    this.platform ??= createDefaultPlatform(options.platform);
    this.target ??=
      options.target ?? typeof window === "undefined" ? undefined : window;
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

  on(listener: ShortcutDefaultEventListener): this;
  on(expression: string, listener: ShortcutCommandListener): this;
  on(...args: any[]): this {
    if (args.length === 2) {
      const command = new KeyCommand(this, args[0], args[1]);
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

  private _initResult(): void {
    this._lastResult = this._result;
    this._result = ShortcutResult.Skip;
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

  private _isAlreadyPressedKeyCode(keyCode: string): boolean {
    return this.pressedKeyMap[keyCode];
  }

  private _updateKey(event: KeyboardEvent): void {
    if (event.type === "keydown") {
      this.pressedKeyMap[event.code] = true;
      this.activeKeyMap[event.key] = true;
    } else {
      delete this.pressedKeyMap[event.code];
      delete this.activeKeyMap[event.key];
    }
  }

  private _match(event: KeyboardEvent): void {
    for (const command of this.commands) {
      this._result = command.match(event);

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

  private _onKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    if (event.repeat) {
      return;
    }

    this._initResult();

    if (Shortcut.isModifier(event.key)) {
      this._updateModifier(event);
      return;
    }

    if (this._isAlreadyPressedKeyCode(event.code)) {
      return;
    }

    this._updateKey(event);
    this._match(event);
  }

  private _onKeyUp(event: KeyboardEvent): void {
    this._updateModifier(event);
    this._updateKey(event);
  }

  private _onBlur(event: Event) {
    this.pressedModifierMap = {};
    this.pressedKeyMap = {};
    this.activeModifierMap = {};
    this.activeKeyMap = {};
  }
}
