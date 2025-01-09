import { cpus } from "os";
import pLimit from "p-limit";
import ProgressBar from "progress";

/** Run a set of tasks displaying a progress bar. */
async function withProgress<T>(
  total: number,
  desc: string,
  fn: (bar: ProgressBar) => Promise<T>
): Promise<T> {
  const start = Date.now();
  const bar = new ProgressBar(`${desc} [:bar] :current/:total :percent :etas`, {
    total,
  });
  const retval = await fn(bar);
  const sec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`${desc} complete for ${total} items in ${sec}s`);
  return retval;
}

/** Run a set of tasks at CPU concurrency with a progress bar. */
export function runConc<T>(
  name: string,
  tasks: (() => Promise<T>)[]
): Promise<T[]> {
  const pool = pLimit(cpus().length);
  return withProgress(tasks.length, name, (bar) =>
    Promise.all(
      tasks.map(async (t) => {
        const result = await pool(t);
        bar.tick();
        return result;
      })
    )
  );
}
