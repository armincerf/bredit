<script lang="ts">
    import { exportGif, exportVideo } from "../helpers/exportHelpers";
    import type { Rect, Range, Quality } from "../helpers/utilityTypes";
    import { fade } from "svelte/transition";
    import type { VideoDetails } from "../helpers/mediaHelpers";

    export let srcVideoUrl: string;
    export let trim: Range;
    export let cuts: Range[];
  export let videoDetails: VideoDetails;
    export let crop: Rect;
    let format = "video";
    let frameRate = 15;
    let quality: Quality = "medium";
    let scale = 1;
    let speed = 1;
    let exportPromise = null;
    let exportProgress = 0;


    const handleSubmit = async () => {
    const exportFunction = format === "video" ? exportVideo : exportGif;
    exportPromise = exportFunction(
      {
        srcVideoUrl,
        crop,
        trim,
        quality,
        frameRate,
        scale,
        speed,
        cuts,
        videoDetails,
      },
      (progress) => (exportProgress = progress)
    );

    try {
      exportProgress = 0;
      await exportPromise;
      exportProgress = 1;
    } finally {
      exportPromise = null;
    }
  };

</script>

<style>
    form {
        display: flex;
        gap: 1em;
        padding: 3em;
    }
    .speed-label {
        display: flex;
        flex-direction: column;
    }

    select {
        display: block;
    }

    .export-button {
        z-index: 2;
        align-self: flex-end;
    height: 27px;
    padding: 0 1em;
    }

    abbr {
        text-decoration: none;
    }
</style>

{#if exportPromise}
<div transition:fade>
    {#await exportPromise}
        <label>
            Exporting:
            {Math.round(exportProgress * 100)}%
            <progress value={exportProgress} max={1} />
        </label>
    {:catch error}
        Error while exporting
        {error.message}
    {/await}
</div>
{/if}
<form on:submit|preventDefault={handleSubmit}>
    <fieldset>
        <legend>Format</legend>

        <div role="group" class="checkbox-button-group">
            <input
                type="radio"
                aria-label="Video"
                value="video"
                bind:group={format} />
            <input
                type="radio"
                aria-label="GIF"
                value="gif"
                bind:group={format} />
        </div>
    </fieldset>
    <label class="speed-label">
        Speed
        <input type="number" bind:value={speed} step={0.25} min={0.25} />
    </label>
    <fieldset>
        <legend><abbr title="Frames per Second">FPS</abbr></legend>
        <div class="checkbox-button-group">
            <input
                type="radio"
                aria-label="10"
                value={10}
                bind:group={frameRate} />
            <input
                type="radio"
                aria-label="15"
                value={15}
                bind:group={frameRate} />
            <input
                type="radio"
                aria-label="30"
                value={30}
                bind:group={frameRate} />
        </div>
    </fieldset>
    <label>
        Quality
        <select bind:value={quality}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
        </select>
    </label>
    <label>
        Resize
        <select bind:value={scale}>
            <option value={1}>100%</option>
            <option value={0.75}>75%</option>
            <option value={0.5}>50%</option>
            <option value={0.25}>25%</option>
        </select>
    </label>
    <button
        type="submit"
        class="export-button"
        disabled={Boolean(exportPromise)}>
        Export
    </button>
</form>
