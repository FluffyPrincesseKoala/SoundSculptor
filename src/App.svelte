<script>
  import WireBall from "./lib/WireBall.svelte";
  let audioContext = null;

  let canUseAudio = false;
</script>

{#if canUseAudio}
  <WireBall />
  <div id="debug" class="debug"></div>
{:else}
  <button on:click={() => (canUseAudio = !canUseAudio)}>Enable audio</button>
{/if}

<!-- <WireBall /> -->
<style>
  .debug {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 100;
  }
  button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 10vh 20vw;
  }
</style>
