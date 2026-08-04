export function createBuildQueue(build, { onSuccess = () => {}, onError = () => {} } = {}) {
  let running = null;
  let pending = false;

  return function enqueueBuild() {
    if (running) {
      pending = true;
      return running;
    }

    running = (async () => {
      do {
        pending = false;
        try {
          await build();
          onSuccess();
        } catch (error) {
          onError(error);
        }
      } while (pending);
    })();

    running.finally(() => {
      running = null;
    });
    return running;
  };
}
