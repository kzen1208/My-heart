let scene, camera, renderer, heartModel, controls;
let isAnimating = false;

document.addEventListener("DOMContentLoaded", function () {
  initThreeJS();
  setupInteractions();
  setupMusic();
  setupResponseHandling();
  setupHeartCursor();
});

function setupHeartCursor() {
  const container = document.getElementById("heart-cursor-container");
  const hearts = ["❤️", "💖", "💕", "💗", "💝"];
  const colors = ["#ff1744", "#ff4569", "#ff6b9d", "#ff8fa3"];

  let lastTime = 0;

  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastTime < 50) return; // Throttle
    lastTime = now;

    for (let i = 0; i < 3; i++) {
      const heart = document.createElement("div");
      heart.className = "cursor-heart";
      heart.innerHTML = hearts[Math.floor(Math.random() * hearts.length)];
      heart.style.color = colors[Math.floor(Math.random() * colors.length)];
      heart.style.left = e.clientX + "px";
      heart.style.top = e.clientY + "px";

      const dx = (Math.random() - 0.5) * 60;
      const dy = -Math.random() * 40 - 20;
      const rotation = (Math.random() - 0.5) * 360;

      heart.style.setProperty("--dx", dx + "px");
      heart.style.setProperty("--dy", dy + "px");
      heart.style.setProperty("--rotation", rotation + "deg");

      container.appendChild(heart);

      setTimeout(() => heart.remove(), 800);
    }
  });
}

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

    // Add event listener for buttons
    setTimeout(() => {
      const startBtn = responseContent.querySelector(".glass-button");
      if (startBtn) {
        if (type === "accept") {
          startBtn.addEventListener("click", showLoverForm);
        } else {
          startBtn.addEventListener("click", showFriendPhotobooth);
        }
      }
      responseSection.scrollIntoView({
        behavior: "smooth",
      });
    }, 300);
  }
}
function showFriendPhotobooth() {
  const responseContent = document.getElementById("response-content");
  const photobooth = `
    <div class="text-center">
      <h2 class="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg" style="font-family: 'Camiro', serif;">Chụp ảnh kỷ niệm nhé! 📸</h2>
      <p class="text-lg md:text-xl text-white mb-8 drop-shadow-lg px-4">
        Dù chỉ là bạn bè, nhưng những kỷ niệm đẹp vẫn đáng được lưu giữ 💛
      </p>
      
      <div class="photobooth-section mb-6">
        <div class="photobooth-frame">
          <video id="camera-video" class="photobooth-media" autoplay playsinline style="display: none;"></video>
          <canvas id="photo-canvas" class="photobooth-media" style="display: none;"></canvas>
          <div id="countdown-overlay" class="countdown-overlay" style="display: none;">
            <div class="countdown-number">3</div>
          </div>
          <div id="photo-preview" class="photo-placeholder">
            <div class="placeholder-content">
              <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
              <p class="text-sm opacity-80">Chụp ảnh kỷ niệm bạn bè</p>
            </div>
          </div>
        </div>
        
        <div class="photobooth-controls mt-4">
          <button id="start-camera-btn" class="glass-button mr-2" style="background: linear-gradient(135deg, rgba(255, 192, 203, 0.3), rgba(255, 0, 128, 0.4));">
            <i class="ri-camera-line mr-2"></i>Bật camera
          </button>
          <button id="take-photo-btn" class="glass-button mr-2" style="background: linear-gradient(135deg, rgba(255, 105, 180, 0.4), rgba(255, 20, 147, 0.4)); display: none;">
            <i class="ri-camera-3-line mr-2"></i>Chụp ảnh
          </button>
          <button id="retake-photo-btn" class="glass-button mr-2" style="background: linear-gradient(135deg, rgba(255, 165, 0, 0.4), rgba(255, 140, 0, 0.4)); display: none;">
            <i class="ri-refresh-line mr-2"></i>Chụp lại
          </button>
          <button id="download-photo-btn" class="glass-button" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(22, 163, 74, 0.4)); display: none;">
            <i class="ri-download-line mr-2"></i>Tải ảnh
          </button>
        </div>
      </div>
    </div>
  `;
  
  responseContent.innerHTML = photobooth;
  initPhotobooth();
}

function showLoverForm() {
  const responseContent = document.getElementById("response-content");
  const formContent = `
    <div class="glass-form-container">
      <div class="glass-notification mb-6">
        <h3 class="text-xl font-bold text-white mb-2">Chào mừng người mà anh iu 💕</h3>
        <p class="text-sm text-white opacity-90">Hãy chia sẻ thông tin để anh hiểu em hơn nhé</p>
      </div>
      
      <form class="glass-form" id="lover-form">
        <div class="form-group">
          <label class="form-label">Tên của em</label>
          <input type="text" class="form-input" placeholder="Nhập tên của em..." required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Ngày sinh của em</label>
          <input type="date" class="form-input" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Sở thích của em</label>
          <textarea class="form-input form-textarea" placeholder="Em thích làm gì? Ăn gì? Nghe nhạc gì?..." rows="3" required></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Mơ ước của em</label>
          <textarea class="form-input form-textarea" placeholder="Em mong muốn điều gì trong tương lai?..." rows="2" required></textarea>
        </div>
        
        <button type="submit" class="glass-button w-full mt-4" style="background: linear-gradient(135deg, rgba(255, 105, 180, 0.4), rgba(255, 20, 147, 0.4));">
          Gửi thông tin
        </button>
      </form>
    </div>
  `;

  responseContent.innerHTML = formContent;
  document
    .getElementById("lover-form")
    .addEventListener("submit", handleFormSubmit);
}

// Data storage
let loverData = JSON.parse(localStorage.getItem('loverData')) || [];

function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  
  // Collect form data
  const data = {
    name: form.querySelector('input[type="text"]').value,
    birthDate: form.querySelector('input[type="date"]').value,
    hobbies: form.querySelector('textarea:first-of-type').value,
    dreams: form.querySelector('textarea:last-of-type').value,
    submittedAt: new Date().toLocaleString('vi-VN')
  };
  
  // Save to localStorage
  loverData.push(data);
  localStorage.setItem('loverData', JSON.stringify(loverData));
  
  const responseContent = document.getElementById("response-content");

  const successContent = `
    <div class="text-center">
      <div class="glass-notification success-notification">
        <h3 class="text-2xl font-bold text-white mb-4" style="font-family: 'Camiro', serif;">Hoàn thành</h3>
        <p class="text-lg text-white mb-4">
          Cảm ơn em đã chia sẻ! Anh sẽ ghi nhớ tất cả để hiểu và yêu em hơn mỗi ngày
        </p>
        <div class="text-sm text-white opacity-80 mb-6">
          Bây giờ chúng ta chính thức là người yêu của nhau rồi
        </div>
        
        <div class="photobooth-section mb-6">
          <div class="photobooth-frame">
            <video id="camera-video" class="photobooth-media" autoplay playsinline style="display: none;"></video>
            <canvas id="photo-canvas" class="photobooth-media" style="display: none;"></canvas>
            <div id="countdown-overlay" class="countdown-overlay" style="display: none;">
              <div class="countdown-number">3</div>
            </div>
            <div id="photo-preview" class="photo-placeholder">
              <div class="placeholder-content">
                <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
                <p class="text-sm opacity-80">Chụp ảnh kỷ niệm của chúng ta</p>
              </div>
            </div>
          </div>
          
          <div class="photobooth-controls mt-4">
            <button id="photo-btn" onclick="startCamera()" class="glass-button-primary">
              <i class="ri-camera-fill mr-2"></i>Chụp ảnh kỷ niệm
            </button>
          </div>
          
          <div id="photo-reactions" class="photo-reactions" style="display: none;">
            <div class="reactions-list">
              <span class="reaction" onclick="addReaction('😍')">😍</span>
              <span class="reaction" onclick="addReaction('💕')">💕</span>
              <span class="reaction" onclick="addReaction('😘')">😘</span>
              <span class="reaction" onclick="addReaction('🥰')">🥰</span>
              <span class="reaction" onclick="addReaction('😊')">😊</span>
              <span class="reaction" onclick="addReaction('💖')">💖</span>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <button onclick="exportToExcel()" class="glass-button-secondary">
            <i class="ri-file-excel-line mr-2"></i>Xuất dữ liệu Excel
          </button>
        </div>
      </div>
    </div>
  `;

  responseContent.innerHTML = successContent;
}

function exportToExcel() {
  if (loverData.length === 0) {
    alert('Không có dữ liệu để xuất!');
    return;
  }
  
  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(loverData.map(item => ({
    'Tên': item.name,
    'Ngày sinh': item.birthDate,
    'Sở thích': item.hobbies,
    'Mơ ước': item.dreams,
    'Thời gian gửi': item.submittedAt
  })));
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Thông tin người yêu');
  
  // Export file
  XLSX.writeFile(wb, `thong-tin-nguoi-yeu-${new Date().toISOString().split('T')[0]}.xlsx`);
}
let stream = null;

function startCamera() {
  const video = document.getElementById('camera-video');
  const preview = document.getElementById('photo-preview');
  const photoBtn = document.getElementById('photo-btn');
  
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(mediaStream => {
      stream = mediaStream;
      video.srcObject = stream;
      video.style.display = 'block';
      preview.style.display = 'none';
      
      photoBtn.innerHTML = `
        <div class="flex gap-2">
          <button onclick="startCountdown()" class="glass-button-primary">
            <i class="ri-camera-fill mr-2"></i>Chụp ảnh
          </button>
          <button onclick="closeCamera()" class="glass-button-secondary">
            <i class="ri-close-line mr-2"></i>Đóng camera
          </button>
        </div>
      `;
    })
    .catch(err => {
      alert('Không thể truy cập camera: ' + err.message);
    });
}

function startCountdown() {
  const countdown = document.getElementById('countdown-overlay');
  const countdownNumber = countdown.querySelector('.countdown-number');
  let count = 3;
  
  countdown.style.display = 'flex';
  
  const countInterval = setInterval(() => {
    countdownNumber.textContent = count;
    countdownNumber.style.animation = 'none';
    setTimeout(() => {
      countdownNumber.style.animation = 'countdown-pulse 1s ease-in-out';
    }, 10);
    
    count--;
    
    if (count < 0) {
      clearInterval(countInterval);
      countdown.style.display = 'none';
      takePhoto();
    }
  }, 1000);
}

function takePhoto() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('photo-canvas');
  const preview = document.getElementById('photo-preview');
  const photoBtn = document.getElementById('photo-btn');
  const ctx = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Apply skin smoothing filter
  ctx.filter = 'blur(0.5px) brightness(1.1) contrast(0.9) saturate(1.1)';
  ctx.drawImage(video, 0, 0);
  
  // Additional skin smoothing effect
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Soften skin tones (reduce red intensity slightly)
    data[i] = Math.min(255, data[i] * 0.95 + 10); // Red
    data[i + 1] = Math.min(255, data[i + 1] * 0.98 + 5); // Green
    data[i + 2] = Math.min(255, data[i + 2] * 1.02); // Blue
  }
  
  ctx.putImageData(imageData, 0, 0);
  const photoData = canvas.toDataURL('image/png');
  
  video.style.display = 'none';
  preview.style.display = 'flex';
  preview.innerHTML = `
    <img src="${photoData}" alt="Ảnh kỷ niệm" class="photobooth-media">
  `;
  
  // Show success notification
  showPhotoSuccess();
  
  photoBtn.innerHTML = `
    <div class="flex gap-2 justify-center">
      <button onclick="downloadPhoto('${photoData}')" class="glass-button-primary">
        <i class="ri-download-line mr-2"></i>Tải ảnh
      </button>
      <button onclick="resetCamera()" class="glass-button-secondary">
        <i class="ri-camera-line mr-2"></i>Chụp lại
      </button>
    </div>
  `;
  
  // Show reactions
  document.getElementById('photo-reactions').style.display = 'block';
  
  stopCamera();
}

function closeCamera() {
  const video = document.getElementById('camera-video');
  const preview = document.getElementById('photo-preview');
  const photoBtn = document.getElementById('photo-btn');
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  
  video.style.display = 'none';
  preview.style.display = 'flex';
  preview.innerHTML = `
    <div class="placeholder-content">
      <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
      <p class="text-sm opacity-80">Chụp ảnh kỷ niệm của chúng ta</p>
    </div>
  `;
  
  photoBtn.innerHTML = `
    <button onclick="startCamera()" class="glass-button-primary">
      <i class="ri-camera-fill mr-2"></i>Chụp ảnh kỷ niệm
    </button>
  `;
  
  document.getElementById('photo-reactions').style.display = 'none';
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

function resetCamera() {
  const preview = document.getElementById('photo-preview');
  preview.style.display = 'flex';
  preview.innerHTML = `
    <div class="placeholder-content">
      <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
      <p class="text-sm opacity-80">Chụp ảnh kỷ niệm của chúng ta</p>
    </div>
  `;
  document.getElementById('photo-reactions').style.display = 'none';
  stopCamera();
  startCamera();
}

function showPhotoSuccess() {
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.9), rgba(255, 20, 147, 0.9));
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    font-size: 18px;
    font-weight: bold;
    z-index: 1000;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  `;
  notification.innerHTML = '📸 Chụp ảnh thành công! 💕';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

function addReaction(emoji) {
  const reaction = document.createElement('div');
  reaction.style.cssText = `
    position: fixed;
    font-size: 30px;
    pointer-events: none;
    z-index: 1000;
    animation: reaction-float 2s ease-out forwards;
  `;
  reaction.textContent = emoji;
  
  const rect = event.target.getBoundingClientRect();
  reaction.style.left = rect.left + 'px';
  reaction.style.top = rect.top + 'px';
  
  document.body.appendChild(reaction);
  
  setTimeout(() => {
    reaction.remove();
  }, 2000);
}

function downloadPhoto(dataUrl) {
  const link = document.createElement('a');
  link.download = `anh-yeu-em-${new Date().toISOString().split('T')[0]}.png`;
  link.href = dataUrl;
  link.click();
}
function showFriendPhotobooth() {
  const responseContent = document.getElementById("response-content");
  
  const friendContent = `
    <div class="text-center">
      <div class="glass-notification success-notification">
        <h3 class="text-2xl font-bold text-white mb-4" style="font-family: 'Camiro', serif;">Cảm ơn bạn!</h3>
        <p class="text-lg text-white mb-4">
          Dù không thể là người yêu nhưng chúng ta vẫn có thể là những người bạn tốt
        </p>
        <div class="text-sm text-white opacity-80 mb-6">
          Hãy chụp một tấm ảnh kỷ niệm tình bạn đẹp của chúng ta nhé!
        </div>
        
        <div class="photobooth-section mb-6">
          <div class="photobooth-frame">
            <video id="camera-video" class="photobooth-media" autoplay playsinline style="display: none;"></video>
            <canvas id="photo-canvas" class="photobooth-media" style="display: none;"></canvas>
            <div id="countdown-overlay" class="countdown-overlay" style="display: none;">
              <div class="countdown-number">3</div>
            </div>
            <div id="photo-preview" class="photo-placeholder">
              <div class="placeholder-content">
                <i class="ri-camera-line text-4xl mb-2 opacity-60"></i>
                <p class="text-sm opacity-80">Chụp ảnh kỷ niệm tình bạn</p>
              </div>
            </div>
          </div>
          
          <div class="photobooth-controls mt-4">
            <button id="photo-btn" onclick="startCamera()" class="glass-button-primary">
              <i class="ri-camera-fill mr-2"></i>Chụp ảnh kỷ niệm
            </button>
          </div>
          
          <div id="photo-reactions" class="photo-reactions" style="display: none;">
            <div class="reactions-list">
              <span class="reaction" onclick="addReaction('😊')">😊</span>
              <span class="reaction" onclick="addReaction('🤝')">🤝</span>
              <span class="reaction" onclick="addReaction('👫')">👫</span>
              <span class="reaction" onclick="addReaction('💛')">💛</span>
              <span class="reaction" onclick="addReaction('😄')">😄</span>
              <span class="reaction" onclick="addReaction('🌟')">🌟</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  responseContent.innerHTML = friendContent;
}
