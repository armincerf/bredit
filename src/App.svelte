<script lang="ts">
  import RecordInput from "./components/RecordInput.svelte";
  import {getVideoDetails} from "./helpers/mediaHelpers";
  import Editor from "./components/Editor.svelte";
 import DeviceDetector from "svelte-device-detector";

  let videoUrl: string | undefined;
  let detailsPromise;

  const handleNewVideo = video => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    videoUrl = URL.createObjectURL(video);
    detailsPromise = getVideoDetails(videoUrl)
  };

  const discardVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      videoUrl = null;
    }
  }

</script>


{#if videoUrl}

    {#await detailsPromise}
        <p>Loading video details</p>
    {:then details}
        <Editor videoUrl={videoUrl}
                videoDetails={details}
                onDiscard={discardVideo}/>
    {:catch error}
        <p>Something went wrong {error.message}</p>
    {/await}

{:else}
    <div class="page-column">
        <header>
            <h1>bredit</h1>
            <h2>The world's first bread themed 'Browser Editor'</h2>
        </header>
        <DeviceDetector showInDevice="desktop">
        <form>
            <RecordInput onComplete={handleNewVideo} onIsIdleChange={isIdle => isIdle}/>
        </form>
        </DeviceDetector>
        <DeviceDetector showInDevice="mobile">
          <h3>Sorry, due to android and iOS limitations, this app won't work on your device. Try on any desktop browser! (except safari, because that acts a bit weird too...)
        </DeviceDetector>
        <DeviceDetector showInBrowser="safari">
          <h1>Safari doesn't support the required APIs, please try any other desktop browser.</h1>
        </DeviceDetector>
        <article>
          <h3>How to use:</h3>
          <ol>
            <li>Accept permissions and select area you wish to record</li>
            <li>Do your thing</li>
            <li>Edit the clip (space to play/pause, arrow keys to trim, b to toggle blade, drag on preview to crop)</li>
            <li>Export (.gif by default - right click for more export options)</li>
          </ol>
          <h3>Known Issues:</h3>
          <ul>
            <li>Doesn't work on mobile devices</li>
            <li>Doesn't work on Safari</li>
            <li>Has a stupid name</li>
            <li>Probably lots of better alternatives out there</li>
          </ul>
        </article>
    </div>
{/if}

<style>
  .page-column {
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
  li {
    padding-left: 0.5em;
    text-align: justify;
  }
  h1 {
    color: var(--color-accent);
    font-size: 4rem;
  }

  h2 {
    font-weight: normal;
  }

  h3 {
    padding: 1em;
  }

  header {
    max-width: 1100px;
    margin: 0 auto;
  }

  form {
    text-align: center;
  }

</style>
