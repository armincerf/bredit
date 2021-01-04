<script lang="ts">
  import { fade } from "svelte/transition";
  import CustomMenu from "./CustomMenu.svelte";
  import ExportModal from "./ExportModal.svelte";
  import { getContext } from "svelte";

  import { exportGif, exportVideo } from "../helpers/exportHelpers";
  import type { Rect, Range, Quality } from "../helpers/utilityTypes";
import type { VideoDetails } from "../helpers/mediaHelpers";

  export let srcVideoUrl: string;
  export let trim: Range;
  export let cuts: Range[];
  export let videoDetails: VideoDetails;
  export let crop: Rect;

  const { open } = getContext("simple-modal");

  let format = "gif";
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

  const showExportModal = () => {
    open(ExportModal, {
      srcVideoUrl: srcVideoUrl,
      trim: trim,
      crop: crop,
      videoDetails: videoDetails,
      cuts: cuts,
    });
  };
</script>

<style>
  .export-row {
    display: flex;
  }

  progress {
    display: block;
  }
</style>

<div class="export-row">
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
  <button on:click={handleSubmit}>Export</button>
</div>
<CustomMenu exportFunction={showExportModal} />
