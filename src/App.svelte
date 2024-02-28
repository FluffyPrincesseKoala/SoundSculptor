<script>
  import WireBall from "./lib/WireBall.svelte";
  $: canUseMic = null;
  $: audioContext = null;
</script>

{#if canUseMic}
  <WireBall audioContext />
{:else}
  <button
    on:click={async () => {
      canUseMic = !canUseMic;
      audioContext = new AudioContext();
    }}>Toggle Mic</button
  >
{/if}

<!-- <WireBall /> -->
<style>
  button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 10vh 20vw;
  }
</style>
