import { createSignal, createEffect, createMemo } from "./signal";

describe("Signal", () => {
  describe("createSignal", () => {
    it("should create a signal and read the value", () => {
      const [get, set] = createSignal(0);
      expect(get()).toBe(0);
    });
    it("should create a signal and update the value", () => {
      const [get, set] = createSignal(0);
      set(1);
      expect(get()).toBe(1);
    });
  });

  describe("createEffect", () => {
    it("should run the effect", () => {
      const [get, set] = createSignal(0);
      const effect = jest.fn();
      createEffect(() => {
        get();
        effect();
      });

      set(1);
      expect(effect).toHaveBeenCalledTimes(2);
    });

    it("should create different dependencies on each effect run", () => {
      const [getNum, setNum] = createSignal(0);
      const [getName, setName] = createSignal("John");
      const effect = jest.fn();
      createEffect(() => {
        if (getNum() > 1) {
          getName();
        }
        effect();
      });

      expect(effect).toHaveBeenCalledTimes(1);
      setName("Jane"); // should not trigger the effect
      expect(effect).toHaveBeenCalledTimes(1);
      setNum(2);
      expect(effect).toHaveBeenCalledTimes(2);
      setName("Keren"); // should trigger the effect
      expect(effect).toHaveBeenCalledTimes(3);
    });

    it("Should not trigger the effect if the dependencies changes", () => {
      const [getNum, setNum] = createSignal(0);
      const [getName, setName] = createSignal("John");
      const [getLastName, setLastName] = createSignal("Doe");
      const effect = jest.fn();
      createEffect(() => {
        if (getNum() > 1) {
          getName();
        } else {
          getLastName();
        }
        effect();
      });

      expect(effect).toHaveBeenCalledTimes(1);
      setName("Jane"); // should not trigger the effect
      expect(effect).toHaveBeenCalledTimes(1);
      setLastName("Smith"); // should trigger the effect
      expect(effect).toHaveBeenCalledTimes(2);
      setNum(2);
      expect(effect).toHaveBeenCalledTimes(3);
      setName("Jane"); // should trigger the effect
      expect(effect).toHaveBeenCalledTimes(3);
      setLastName("Doe"); // should not trigger the effect
      expect(effect).toHaveBeenCalledTimes(3);
    });

    it("It should trigger two effect on signal change", () => {
      const [signal, setSignal] = createSignal(0);

      const firstEffect = jest.fn();
      const secondEffect = jest.fn();

      createEffect(() => {
        signal();
        firstEffect();
      });

      createEffect(() => {
        signal();
        secondEffect();
      });

      setSignal(1);

      expect(firstEffect).toHaveBeenCalledTimes(2);
      expect(secondEffect).toHaveBeenCalledTimes(2);
    });

    it("It should trigger effect inside an effect", () => {
      const [outer, setOuter] = createSignal(0);
      const [inner, setInner] = createSignal(0);

      const outerEffect = jest.fn();
      const innerEffect = jest.fn();

      createEffect(() => {
        outer();
        outerEffect();
        createEffect(() => {
          inner();
          innerEffect();
        });
      });

      expect(outerEffect).toHaveBeenCalledTimes(1);
      expect(innerEffect).toHaveBeenCalledTimes(1);

      setInner(1);
      expect(outerEffect).toHaveBeenCalledTimes(1);
      expect(innerEffect).toHaveBeenCalledTimes(2);
      setOuter(1);
      expect(outerEffect).toHaveBeenCalledTimes(2);
      expect(innerEffect).toHaveBeenCalledTimes(3);
    });

    it("Should listen to change via a computation function", () => {
      const [num, setNum] = createSignal(0);
      const computation = jest.fn(() => {
        return num() * 2;
      });

      createEffect(computation);

      expect(computation).toHaveBeenCalledTimes(1);

      setNum(1);

      expect(computation).toHaveBeenCalledTimes(2);
    });

    it("Should not run the effect if the same value is set", () => {
      const [num, setNum] = createSignal(0);
      const effect = jest.fn(() => {
        num();
      });

      createEffect(effect);

      expect(effect).toHaveBeenCalledTimes(1);

      setNum(0);

      expect(effect).toHaveBeenCalledTimes(1);
    });
  });

  describe("createMemo", () => {
    it("Should return the correct value", () => {
      const [num, setNum] = createSignal(0);
      const memo = createMemo(() => {
        return num() * 2;
      });

      expect(memo()).toBe(0);

      setNum(1);

      expect(memo()).toBe(2);
    });

    it("Should not run the memo function if the value is the same", () => {
      const [num, setNum] = createSignal(0);
      const trackMemo = jest.fn();
      const memo = createMemo(() => {
        trackMemo();
        return num() * 2;
      });

      expect(memo()).toBe(0);
      expect(trackMemo).toHaveBeenCalledTimes(1);

      setNum(0);

      expect(memo()).toBe(0);
      expect(trackMemo).toHaveBeenCalledTimes(1);
    });

    it("Should memoize the value for multiple calls", () => {
      const [num, setNum] = createSignal(0);
      const trackMemo = jest.fn();
      const memo = createMemo(() => {
        trackMemo();
        return num() * 2;
      });

      createEffect(() => {
        memo();
      });

      createEffect(() => {
        memo();
      });

      expect(memo()).toBe(0);
      expect(trackMemo).toHaveBeenCalledTimes(1);

      setNum(1);

      expect(memo()).toBe(2);
      expect(trackMemo).toHaveBeenCalledTimes(2);
    });
  });
});
