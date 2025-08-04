let scene, camera, renderer, heartModel, controls;
let isAnimating = false;

document.addEventListener("DOMContentLoaded", function () {
  initThreeJS();
  setupInteractions();
  setupMusic();
  setupResponseHandling();
});

function setupMusic() {
  const music = document.getElementById("background-music");
  music.volume = 0.3;

  // Auto play music on first user interaction
  document.addEventListener(
    "click",
    function () {
      if (music.paused) {
        music.play().catch((e) => console.log("Music play failed:", e));
      }
    },
    { once: true }
  );
}

function initThreeJS() {
  const canvas = document.getElementById("heart-canvas");

  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  });
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;
  renderer.setSize(containerWidth, containerHeight);
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xff69b4, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xff1493, 0.5, 100);
  pointLight.position.set(-5, 5, 5);
  scene.add(pointLight);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.maxDistance = 50;
  controls.minDistance = 1;

  // Detect user interaction
  controls.addEventListener("start", () => {
    userInteracting = true;
  });
  controls.addEventListener("end", () => {
    setTimeout(() => {
      userInteracting = false;
    }, 2000); // Resume auto movement after 2s
  });

  // Load GLB model
  const loader = new THREE.GLTFLoader();
  loader.load(
    "19 Hearts.glb",
    function (gltf) {
      heartModel = gltf.scene;
      heartModel.scale.set(4, 4, 4);
      heartModel.position.set(0, -1, 0);

      // Keep original materials and colors
      heartModel.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(heartModel);

      // Position camera
      camera.position.set(0, 0, 5);
      controls.target.set(0, 0, 0);
      controls.update();

      // Start animation loop
      animate();
    },
    undefined,
    function (error) {
      console.error("Error loading GLB model:", error);
    }
  );
}

let cameraTime = 0;
let userInteracting = false;

function animate() {
  requestAnimationFrame(animate);

  if (heartModel) {
    if (!isAnimating) {
      heartModel.rotation.y += 0.01;

      // Auto camera movement only when user is not interacting
      if (!userInteracting) {
        cameraTime += 0.005;
        const radius = 8;
        const height = Math.sin(cameraTime * 0.7) * 3;
        const angle = cameraTime * 0.3;

        camera.position.x = Math.cos(angle) * radius;
        camera.position.z = Math.sin(angle) * radius;
        camera.position.y = height;

        camera.lookAt(0, 0, 0);
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

function setupInteractions() {
  const heartContainer = document.getElementById("heart-container");
  const explosionContainer = document.getElementById("explosion-container");
  const confessionSection = document.getElementById("confession-section");
  const secondMessage = document.getElementById("second-message");

  function handleHeartInteraction() {
    if (!isAnimating) {
      isAnimating = true;

      // Create explosion effect only
      createHeartExplosion();

      setTimeout(() => {
        confessionSection.classList.add("show");
        document.getElementById("confession-section").scrollIntoView({
          behavior: "smooth",
        });
        setTimeout(() => {
          secondMessage.classList.remove("opacity-0", "translate-y-10");
        }, 1500);
        isAnimating = false;
      }, 800);
    }
  }

  // Add both click and touch events for mobile compatibility
  heartContainer.addEventListener("click", handleHeartInteraction);
  heartContainer.addEventListener(
    "touchend",
    function (e) {
      e.preventDefault();
      handleHeartInteraction();
    },
    { passive: false }
  );

  // Resize handler
  window.addEventListener("resize", function () {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    renderer.setSize(containerWidth, containerHeight);
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
  });
}

function createHeartExplosion() {
  const explosionContainer = document.getElementById("explosion-container");
  for (let i = 0; i < 12; i++) {
    createSmallHeart(i, explosionContainer);
  }
}

function createSmallHeart(index, container) {
  const heart = document.createElement("div");
  heart.className = "small-heart";
  heart.innerHTML = "💖";
  const angle = (index * 30 * Math.PI) / 180;
  const distance = 200 + Math.random() * 100;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  heart.style.setProperty("--dx", dx + "px");
  heart.style.setProperty("--dy", dy + "px");
  heart.style.left = "50%";
  heart.style.top = "50%";
  container.appendChild(heart);
  setTimeout(() => {
    heart.classList.add("animate");
  }, 100);
  setTimeout(() => {
    heart.remove();
  }, 2100);
}

function setupResponseHandling() {
  const acceptBtn = document.getElementById("accept-btn");
  const declineBtn = document.getElementById("decline-btn");
  const responseSection = document.getElementById("response-section");
  const responseContent = document.getElementById("response-content");

  let declineAttempts = 0;
  let isDeclineDisabled = false;

  // Make accept button glow
  acceptBtn.classList.add("accept-glow");

  acceptBtn.addEventListener("click", function () {
    showResponse("accept");
  });

  acceptBtn.addEventListener(
    "touchend",
    function (e) {
      e.preventDefault();
      showResponse("accept");
    },
    { passive: false }
  );

  // Add hover effects for decline button
  declineBtn.addEventListener("mouseenter", function () {
    if (declineAttempts < 8) {
      const animations = ["decline-dodge", "decline-shrink", "decline-fade"];
      const randomAnimation =
        animations[Math.floor(Math.random() * animations.length)];
      declineBtn.classList.add(randomAnimation);

      setTimeout(() => {
        declineBtn.classList.remove(randomAnimation);
      }, 500);
    }
  });

  function handleDeclineClick(e) {
    declineAttempts++;

    if (declineAttempts <= 8) {
      e.preventDefault();

      // Different reactions based on attempts
      if (declineAttempts === 1) {
        declineBtn.classList.add("decline-shake");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Bạn chắc chưa? 🥺';
        setTimeout(() => declineBtn.classList.remove("decline-shake"), 500);
      } else if (declineAttempts === 2) {
        declineBtn.classList.add("decline-fade");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Thử suy nghĩ lại nhé 💔';
        declineBtn.style.transform = "scale(0.9)";
        setTimeout(() => declineBtn.classList.remove("decline-fade"), 500);
      } else if (declineAttempts === 3) {
        declineBtn.classList.add("decline-shrink");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Mình buồn quá... 😢';
        declineBtn.style.transform = "scale(0.8)";
        declineBtn.style.opacity = "0.7";
        setTimeout(() => declineBtn.classList.remove("decline-shrink"), 300);
      } else if (declineAttempts === 4) {
        declineBtn.classList.add("decline-dodge");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Đừng vậy mà... 🥹';
        declineBtn.style.transform = "scale(0.75)";
        declineBtn.style.opacity = "0.6";
        setTimeout(() => declineBtn.classList.remove("decline-dodge"), 500);
      } else if (declineAttempts === 5) {
        declineBtn.classList.add("decline-shake");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Cho mình cơ hội đi 🙏';
        declineBtn.style.transform = "scale(0.7)";
        declineBtn.style.opacity = "0.5";
        setTimeout(() => declineBtn.classList.remove("decline-shake"), 500);
      } else if (declineAttempts === 6) {
        declineBtn.classList.add("decline-fade");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Mình hứa sẽ tốt... 😭';
        declineBtn.style.transform = "scale(0.65)";
        declineBtn.style.opacity = "0.4";
        setTimeout(() => declineBtn.classList.remove("decline-fade"), 500);
      } else if (declineAttempts === 7) {
        declineBtn.classList.add("decline-shrink");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Lần cuối rồi... 💔';
        declineBtn.style.transform = "scale(0.6)";
        declineBtn.style.opacity = "0.3";
        setTimeout(() => declineBtn.classList.remove("decline-shrink"), 300);
      } else if (declineAttempts === 8) {
        declineBtn.classList.add("decline-dodge");
        declineBtn.innerHTML =
          '<i class="ri-close-line text-xl"></i>Thôi được rồi... 😔';
        declineBtn.style.transform = "scale(0.55)";
        declineBtn.style.opacity = "0.2";
        setTimeout(() => declineBtn.classList.remove("decline-dodge"), 500);
      }

      // Make accept button more attractive with each attempt
      const glowIntensity = 0.6 + declineAttempts * 0.1;
      const scale = 1.05 + declineAttempts * 0.02;
      acceptBtn.style.transform = `scale(${scale})`;
      acceptBtn.style.boxShadow = `0 0 ${
        20 + declineAttempts * 5
      }px rgba(246, 175, 220, ${glowIntensity})`;

      return false;
    } else {
      // Allow click after 8 attempts
      showResponse("decline");
    }
  }

  declineBtn.addEventListener("click", handleDeclineClick);
  declineBtn.addEventListener(
    "touchend",
    function (e) {
      e.preventDefault();
      handleDeclineClick(e);
    },
    { passive: false }
  );

  function showResponse(type) {
    let content = "";
    if (type === "accept") {
      content = `
        <div class="text-center">
          <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg" style="font-family: 'Camiro', serif;">Cảm ơn em người anh iu!</h2>
          <p class="text-lg md:text-2xl text-white mb-8 drop-shadow-lg px-4">
            Cảm ơn em đã cho anh cơ hội để đến gần hơn một chút.
Anh tin rằng… đây không chỉ là một lời đồng ý, mà là khởi đầu cho điều gì đó thật đẹp 💗
Anh rất mong được đồng hành cùng em trong suốt cuộc đời – dù là từng bước nhỏ thôi cũng được.


          </p>
          <button class="glass-button text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium relative z-10" style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 0, 128, 0.4));">
            Cùng bắt đầu nhé 💕
          </button>
        </div>
      `;
    } else {
      content = `
        <div class="text-center">
          <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg" style="font-family: 'Camiro', serif;">Không sao đâu!</h2>
          <p class="text-lg md:text-2xl text-white mb-8 drop-shadow-lg px-4">
            Cảm ơn bạn vì sự chân thành.
Mình trân trọng cảm xúc của bạn và vẫn rất mong có thể làm bạn tốt của nhau 😊
Đôi khi không cần là một cái kết lãng mạn, mà là một tình bạn thật ấm áp.
          </p>
          <button class="glass-button text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium relative z-10" style="background: linear-gradient(135deg, rgba(255, 192, 203, 0.3), rgba(255, 0, 128, 0.4));">
            Làm bạn với nhau nhé 💛
          </button>
        </div>
      `;
    }
    responseContent.innerHTML = content;
    responseSection.classList.remove("opacity-0", "translate-y-10");
    setTimeout(() => {
      responseSection.scrollIntoView({
        behavior: "smooth",
      });
    }, 300);
  }
}
