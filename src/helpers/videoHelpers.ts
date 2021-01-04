import type { Range } from "../helpers/utilityTypes";

export const isInRange = (
    n: number,
    el: Range
  ): boolean => {
    if (el && typeof el.start == 'number' && el.end) {
      let start = Math.min(el.start, el.end);
      let end = Math.max(el.start, el.end);
      if (start <= n && end >= n) {
        return true;
      }
    }
  };

export const cutIntersects = (cuts: Range[], cutPoint: number) => {
    let found = null;
    if(cuts.length) {
        cuts.forEach((el, idx) => {
            if (isInRange(cutPoint, el)) {
                found = idx;
            }
        });
    }
    return found;
  };
