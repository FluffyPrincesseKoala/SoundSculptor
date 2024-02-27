<script>
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";

    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
    import Stats from "three/examples/jsm/libs/stats.module.js";

    import {
        makeWireBall,
        animateWireBall,
        resetPlanePosition,
    } from "./wireBall.js";
    import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
    import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
    import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
    import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
    import { rotate } from "three/examples/jsm/nodes/Nodes.js";

    var stats = Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    let camera, renderer, ball, group, canvas, composer;
    let saveOriginalVertices = [];

    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
    };

    group = new THREE.Group();

    const scene = new THREE.Scene();

    onMount(async () => {
        // Create the camera
        camera = new THREE.PerspectiveCamera(
            75,
            sizes.width / sizes.height,
            0.1,
            1200,
        );
        camera.position.z = 125;
        const controls = new OrbitControls(camera, canvas);

        // Create the renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
        });
        renderer.setSize(sizes.width, sizes.height);
        document.body.appendChild(renderer.domElement);

        // Create the geometry
        let {
            planeGeometry,
            planeMaterial,
            planes,
            icosahedronGeometry,
            lambertMaterial,
            normalMaterial,
            ball,
            ambientLight,
            spotLight,
            saveOriginalVerticesTmp,
            neonMaterial,
        } = makeWireBall(scene, group);
        saveOriginalVertices = saveOriginalVerticesTmp;

        // sample audio from mic
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(
            await navigator.mediaDevices.getUserMedia({ audio: true }),
        );

        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const frequencyData = new Uint8Array(bufferLength);

        //reset the ball to its original state every 5 seconds
        const resetBall = () => {
            for (
                let i = 0;
                i < ball.geometry.attributes.position.array.length;
                i++
            ) {
                ball.geometry.attributes.position.array[i] =
                    saveOriginalVertices[i];
            }
            ball.geometry.attributes.position.needsUpdate = true;
            ball.geometry.computeVertexNormals();
        };

        // effect composer
        const randerScene = new RenderPass(scene, camera);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1,
            0.5,
            0.1,
        );
        bloomPass.threshold = 0;
        // Calculate the distance between the camera and the ball
        const distanceToBall = camera.position.distanceTo(ball.position);
        // Adjust the bloom strength based on the distance
        bloomPass.strength = bloomPass.radius = -0.5;
        const outputPass = new OutputPass();

        composer = new EffectComposer(renderer);
        composer.addPass(randerScene);
        composer.addPass(bloomPass);
        composer.addPass(outputPass);

        /**
         * animate the scene
         **/
        let destroySphere = 0;
        const rotatePlane = {
            active: false,
            speed: 0.005,
            // 10 seconds
            interval: 1000 * 10,
            time: 0,
            reset: false,
        };
        async function animate() {
            stats.begin();
            requestAnimationFrame(animate);

            // composer.render();

            if (destroySphere === 100) {
                resetBall();
                destroySphere = 0;
            }
            destroySphere++;

            analyser.getByteFrequencyData(frequencyData);
            animateWireBall(frequencyData, group, rotatePlane);

            renderer.render(scene, camera);
            composer.render();
            stats.end();
        }

        await animate();

        /**
         * Event listeners
         */
        window.addEventListener("resize", () => {
            // Update sizes
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;

            // Update camera
            camera.aspect = sizes.width / sizes.height;
            camera.updateProjectionMatrix();

            // Update renderer
            renderer.setSize(sizes.width, sizes.height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        window.addEventListener("keydown", (event) => {
            if (event.key === "0") {
                // 0 key
                ball.material = normalMaterial;
            }
            if (event.key === "1") {
                // 1 key
                ball.material = neonMaterial;
            }
            if (event.key === "2") {
                // 2 key
                ball.material = lambertMaterial;
            }
            if (event.key === "r") {
                // reset the camera
                camera.position.z = 125;
                camera.position.x = 0;
                camera.position.y = 0;
                camera.lookAt(0, 0, 0);

                // reset the ball
                resetBall();
                ball.material = lambertMaterial;

                // reset the plane
                rotatePlane.active = false;
                rotatePlane.reset = true;
            }
            if (event.key === "ArrowRight") {
                // right arrow key
                rotatePlane.active = !rotatePlane.active;
                rotatePlane.direction = "right";
            }
            if (event.key === "ArrowLeft") {
                // left arrow key
                rotatePlane.active = !rotatePlane.active;
                rotatePlane.direction = "left";
            }
            if (event.key === "ArrowUp") {
                // up arrow key
                rotatePlane.speed += 0.005;
            }
            // if (event.key === "ArrowDown") {
            //     // down arrow key
            //     rotatePlane.speed -= 0.005;
            // }
        });

        // setInterval(resetBall, 1000);
    });

    onDestroy(() => {
        window.removeEventListener("resize", () => {});
        window.removeEventListener("keydown", () => {});
    });
</script>

<canvas bind:this={canvas}> </canvas>

<style>
    canvas {
        display: block;
    }
</style>
