<script lang="ts">
  import { recordScreen, recordScreenAndCam } from "../helpers/mediaHelpers";

  export let onComplete: (video: Blob) => void;
  export let onIsIdleChange: (isIdle: boolean) => void;

  type Stage = "idle" | "starting" | "recording" | "processing" | "complete";
  let stage: Stage = "idle";
  let errorMessage: string;
  
  $: onIsIdleChange(stage === "idle");

  let stream: MediaStream | undefined;
  let stopStream: (() => void) | undefined;

  let videoPreview: HTMLVideoElement | undefined;

  $: if (videoPreview && videoPreview.srcObject !== stream) {
    videoPreview.srcObject = stream;
  }

  const startRecording = async (recordFunction) => {
    try {
      stage = "starting";
      const streamDetails = await recordFunction();
      stage = "recording";

      stream = streamDetails.stream;
      stopStream = streamDetails.stop;
      streamDetails.videoPromise.then((video) => {
        stage = "complete";
        onComplete(video);
      });
    } catch (error) {
      console.warn("Failed to start recording", error);
      if(error.message != 'Permission denied' || error.type != 'DOMException') {
        errorMessage = "You must allow screen recording and be on a supported browser";
      }
      stage = "idle";
    }
  };
  const stopRecording = async () => {
    stage = "processing";
    stopStream();
  };
</script>

<style>
  video {
    max-width: 50vw;
    width: 100%;
    height: auto;
    transition: filter var(--tns);
    z-index: -1;
  }

  .record-buttons {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    height: 15rem;
  }
  .start-button {
    transform: scale(2);
  }

  .stop-button:hover + video {
    filter: blur(2px);
  }

  .video-container {
    position: relative;
    display: inline-block;
  }
  .stop-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(1.5);
    z-index: 1;
  }
</style>

  {#if errorMessage}
    <button class="start-button disabled"> {errorMessage} </button>
  {:else if stage === 'idle'}
  <div class="record-buttons">
    <button class="start-button" on:click={() => startRecording(recordScreenAndCam)}>
      Record Screen and Webcam (also records audio)
    </button>
    <button class="start-button" on:click={() => startRecording(recordScreen)}>
      Record Only Screen
    </button>
  </div>
  
  {:else if stage === 'starting'}
    <p>Starting screen recording...</p>
  {:else if stage === 'recording'}
    <div class="video-container">
      <button class="stop-button" on:click={stopRecording}>Stop Recording</button>
      <video bind:this={videoPreview} autoplay muted />
    </div>
  {:else if stage === 'processing'}
    <p>Processing video</p>
  {:else if stage === 'complete'}
    <p>Recording complete</p>
  {/if}
