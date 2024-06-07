type Accessor<T> = () => T;
type Setter<T> = (value: T) => void;

type Signal<T> = [Accessor<T>, Setter<T>];

type Effect = {
  execute: () => void;
  dependencies: Set<Set<Effect>>;
};

const context: Effect[] = [];

const subscribe = (observer: Effect, subscribers: Set<Effect>) => {
  // create a two way subscription
  subscribers.add(observer);
  observer.dependencies.add(subscribers);
};

const cleanup = (observer: Effect) => {
  for (const subscriber of observer.dependencies) {
    subscriber.delete(observer); // remove my self from each signal that I was subscribed to
  }
  observer.dependencies.clear(); // then clean all the signals I listen to
};

export const createSignal = <T>(value: T): Signal<T> => {
  let subscribers = new Set<Effect>();

  const get: Accessor<T> = () => {
    const observer = context[context.length - 1];
    if (observer) {
      subscribe(observer, subscribers);
    }
    return value;
  };
  const set: Setter<T> = (newValue) => {
    if (value === newValue) {
      return;
    }
    value = newValue;

    for (const subscriber of [...subscribers]) {
      subscriber.execute();
    }
  };
  return [get, set];
};

export const createEffect = (fn: () => void): void => {
  const effect: Effect = {
    execute: () => {
      // cleanup the previous dependencies
      cleanup(effect);
      context.push(effect);
      fn();
      context.pop();
    },
    dependencies: new Set(),
  };

  effect.execute();
};

export const createMemo = <T>(fn: Accessor<T>): Accessor<T> => {
  // this type assertion is ok as we first initiate the signal in the effect before first read
  const [get, set] = createSignal<T>(undefined as T);

  createEffect(() => {
    set(fn());
  });

  return get;
};
