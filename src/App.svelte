<script>
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";

  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import Stats from "three/examples/jsm/libs/stats.module.js";

  import { makeWireBall, animateWireBall } from "./lib/wireBall.js";
  import WireBall from "./lib/WireBall.svelte";

  import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
  import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
  import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
  import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

  var stats = Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  let frequencyData;
  $: freq = frequencyData;
  onMount(async () => {
    // effect composer
    // const randerScene = new RenderPass(scene, camera);

    // const bloomPass = new UnrealBloomPass(
    //   new THREE.Vector2(window.innerWidth, window.innerHeight),
    //   1.5,
    //   0.4,
    //   0.85,
    // );
    // bloomPass.threshold = 0;
    // bloomPass.strength = 0.5;
    // bloomPass.radius = 0.5;

    // const outputPass = new OutputPass();

    // composer = new EffectComposer(renderer);
    // composer.addPass(randerScene);
    // composer.addPass(bloomPass);
    // composer.addPass(outputPass);

    // sample audio from mic
    let audioContext;

    audioContext = new AudioContext();

    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(
      await navigator.mediaDevices.getUserMedia({ audio: true }),
    );

    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    frequencyData = new Uint8Array(bufferLength);

    /**
     * animate the scene
     **/
    let destroySphere = 0;
    async function animate() {
      stats.begin();
      requestAnimationFrame(animate);

      // composer.render();

      analyser.getByteFrequencyData(frequencyData);
      // animateWireBall(frequencyData, plane, plane2, ball);

      // renderer.render(scene, camera);
      // composer.render();
      stats.end();
    }

    await animate();

    // setInterval(resetBall, 1000);
  });
</script>

<WireBall />
