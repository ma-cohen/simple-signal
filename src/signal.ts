type Accessor<T> = () => T;
type Setter<T> = (value: T) => void;

type Signal<T> = [Accessor<T>, Setter<T>];

// the user call create effect and reads values from the signal
// then someone calls the setter and the effect is called

// so we need to know what the effect is reading

// we need to think about the cleanup of the subscribers

const context: Effect[] = [];

// you create the effect which pushed the function to the context
// then you call set
// set calls the subscribers which calls the effect again which

type Effect = {
  execute: () => void;
  dependencies: Set<Set<Effect>>;
};

const subscribe = (observer: Effect, subscribers: Set<Effect>) => {
  subscribers.add(observer);
  observer.dependencies.add(subscribers);
};

const cleanup = (effect: Effect) => {
  for (const subscriber of effect.dependencies) {
    subscriber.delete(effect); // remove my self from each signal that I was subscribed to
  }
  effect.dependencies.clear(); // then clean all the signals i listen to
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

    // that will create a new set of subscribers
    // what we need is for the next round of calling effects to clean up all the old ones

    for (const subscriber of [...subscribers]) {
      subscriber.execute();
    }
  };
  return [get, set];
};

export const createEffect = (fn: () => void): void => {
  const effect: Effect = {
    execute: () => {
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
