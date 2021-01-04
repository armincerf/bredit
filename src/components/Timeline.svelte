<script lang="ts">
  import { onArrows } from "../helpers/domHelpers";
  import { isInRange, cutIntersects } from "../helpers/videoHelpers";

  export let onTrimChange: ({
    start,
    end,
  }: {
    start: number;
    end: number;
  }) => void;

  export let isPlaying: boolean;
  export let isBlade: boolean;
  export let setTime: (time: number) => void;
  export let cuts;

  const ARROW_INCREMENT = 0.01;

  let start = 0;
  let end = 1;

 let currentCut = {};

  let onCut = false;
  let playhead = 0;

  $: onTrimChange({ start, end });

  let draggingSide: "start" | "end" | null = null;
  let timelineWidth: number;

  const handleTimelinePointerDown = ({ offsetX }) => {
    const xFraction = offsetX / timelineWidth;
    const intersectIdx = cutIntersects(cuts, xFraction);
    const latestCut = cuts[cuts.length - 1];
    let intersect = (typeof intersectIdx == "number")
    if (!isPlaying) {
      if (latestCut && !latestCut.click && intersect) {
        cuts.splice(intersectIdx, 1);
        cuts = cuts
      }  else if (isBlade) {
        if (latestCut && latestCut.click) {
          cuts[cuts.length - 1].click = null
          currentCut = {}
        } else {
          cuts = [...cuts, { click: xFraction }];
        }
      } 
      
    }
  };

 const updateCutsOnPointerMove = (playhead) => {
   let cut = cuts[cuts.length - 1]
   if(cut && cut.click){
     if(cut.click < playhead) {
       cut.start = cut.click
       cut.end = playhead
     } else {
       cut.end = cut.click
       cut.start = playhead
     }
     currentCut = cut
   }
 }

  const handleTimelinePointerMove = ({ offsetX }) => {
    const xFraction = offsetX / timelineWidth;
    if (!isPlaying && isInRange(xFraction, { start: start, end: end })) {
      setTime(xFraction);
      playhead = xFraction;
      if (isBlade) {
        updateCutsOnPointerMove(xFraction)
        onCut = typeof cutIntersects(cuts, xFraction) == "number";
      }
    }
    if (draggingSide === "start") {
      start = xFraction;
      end = Math.max(start, end);
    } else if (draggingSide === "end") {
      end = xFraction;
      start = Math.min(start, end);
    }
  };

  $: timelineStyles = [
    `--time-start: ${100 * start}%`,
    `--time-end: ${100 * end}%`,
    `cursor: ${isBlade && !onCut ? "url(/knife.cur), auto;" : "default"}`,
  ].join(";");
</script>

<style>
  .timeline {
    flex-shrink: 0;
    min-height: 100px;
    position: relative;
  }

  .drag-handle {
    cursor: ew-resize;
    border: none;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 0.5rem;
    padding: 0;
    border-radius: 0;
    background-image: url(/bread.png);
    background-size: cover;
    transform: translateX(-50%);
  }

  .timeline:active * {
    pointer-events: none;
  }

  .drag-handle::before {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    padding: 0 0.5rem 0.25rem;
    line-height: 0.75rem;
    font-variant: all-small-caps;
  }

  .drag-handle.start {
    left: var(--time-start);
  }

  .drag-handle.start::before {
    content: "Start >";
    left: 0.125rem;
  }

  .drag-handle.end {
    left: var(--time-end);
  }

  .drag-handle.end::before {
    content: "End <";
    right: 0.125rem;
  }

  .playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(100% * var(--current-time));
    transform: translateX(-50%);
    z-index: -1;
    background-image: url(/bread.png);
    background-size: cover;
    width: 10px;
    filter: sepia(1);
  }
  .cut {
    position: absolute;
    background-image: url("/cheese.jpg");
    background-repeat: repeat-x;
    bottom: 0;
    height: 100px;
    z-index: -1;
  }
</style>

<div
  class="timeline"
  style={timelineStyles}
  bind:clientWidth={timelineWidth}
  on:pointerdown={handleTimelinePointerDown}
  on:pointermove={handleTimelinePointerMove}
  on:pointerup={() => (draggingSide = null)}>
  <button
    title="Adjust start time (Use arrow keys while selected to advance frame by frame)"
    class="drag-handle start"
    on:pointerdown={() => {
      isBlade = false;
      return (draggingSide = 'start');
    }}
    on:keydown={onArrows((direction) => {
      if (direction === 'left') {
        start -= ARROW_INCREMENT;
      } else if (direction === 'right') {
        start += ARROW_INCREMENT;
      }
    })} />
  <button
    title="Adjust end time (Use arrow keys while selected to advance frame by frame)"
    class="drag-handle end"
    on:pointerdown={() => {
      isBlade = false;
      return (draggingSide = 'end');
    }}
    on:keydown={onArrows((direction) => {
      if (direction === 'left') {
        end -= ARROW_INCREMENT;
      } else if (direction === 'right') {
        end += ARROW_INCREMENT;
      }
    })} />
  {#if currentCut.start}
<div
  class="cut"
        style={[`width: ${Math.abs(currentCut.start - currentCut.end) * 100}%`,
              `left: ${currentCut.start * 100}%`,
              `right: ${currentCut.end * 100}%`].join(';')} />

    {/if}
  {#each cuts as { start, end }}
    {#if start}
        <div
        class="cut"
        style={[`width: ${Math.abs(start - end) * 100}%`,
              `left: ${start * 100}%`,
              `right: ${end * 100}%`].join(';')} />
    {/if}
  {/each}
  <div class="playhead" />
</div>
