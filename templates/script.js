const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const feedbackBtn = document.querySelector("#feedback-btn");
const micBtn = document.querySelector("#mic-btn");
const videoBtn = document.querySelector("#video-btn");
const langSelect = document.querySelector("#lang-select");
const feedbackModal = document.querySelector("#feedback-modal");
const submitFeedbackBtn = document.querySelector("#submit-feedback");
const videoContainer = document.querySelector("#video-container");
const avatarVideo = document.querySelector("#avatar-video");

let userMessage = null;
let isResponseGenerating = false;
let isMicActive = false;
let isVideoActive = false;
let recognition = null;
let hasGreeted = false;
let conversationStarted = false; 
const synth = window.speechSynthesis;
const API_URL = "http://localhost:8000/chat";

const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  hasGreeted = !!savedChats;
  conversationStarted = !!savedChats; 
};

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(' ');
  let currentWordIndex = 0;
  const typingInterval = setInterval(() => {
    textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML);
    }
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  }, 75);
};

const generateAPIResponse = async (incomingMessageDiv, query) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  let chatHistory = JSON.parse(localStorage.getItem("chat-history")) || [];
  try {
    console.log("Sending query:", query);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: query, history: chatHistory, lang: langSelect.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Error fetching response");
    let apiResponse = data.answer;
    if (!hasGreeted && chatContainer.children.length === 1) {
      apiResponse = "Hello! Welcome to the Loubby platform! I'm Loubby Navigator from Team Sigma, here to help you navigate our website.\n\n" + apiResponse;
      hasGreeted = true;
    }
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    localStorage.setItem("chat-history", JSON.stringify(data.history));
    if (isMicActive || isVideoActive) speakResponse(apiResponse);
  } catch (error) {
    console.error("API error:", error.message);
    isResponseGenerating = false;
    textElement.innerText = "Error: Could not get response. Please try again.";
    incomingMessageDiv.classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <img class="avatar" src="/static/images/AI.png" alt="AI avatar">
                  <p class="text"></p>
                  <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  return incomingMessageDiv;
};

const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done";
  setTimeout(() => copyButton.innerText = "content_copy", 1000);
};

const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;
  isResponseGenerating = true;
  const html = `<div class="message-content">
                  <img class="avatar" src="/static/images/image.png" alt="User avatar">
                  <p class="text">${userMessage}</p>
                </div>`;
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  chatContainer.appendChild(outgoingMessageDiv);
  typingForm.reset();
  document.body.classList.add("hide-header"); 
  if (!conversationStarted) {
    conversationStarted = true;
  }
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  const incomingMessageDiv = showLoadingAnimation();
  generateAPIResponse(incomingMessageDiv, userMessage);
  userMessage = null;
};

const initializeRecognition = () => {
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    console.error("Speech Recognition not supported in this browser");
    return;
  }
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = langSelect.value;
  recognition.onresult = (event) => {
    const result = event.results[0];
    if (result.isFinal) {
      userMessage = result[0].transcript;
      console.log("Captured speech:", userMessage);
      document.body.classList.add("hide-header"); 
      if (!conversationStarted) {
        conversationStarted = true;
      }
      handleOutgoingChat();
    }
  };
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isMicActive = false;
    isVideoActive = false;
    micBtn.classList.remove("active");
    videoBtn.classList.remove("active");
    videoContainer.style.display = "none";
  };
  recognition.onend = () => {
    if (isMicActive || isVideoActive) recognition.start();
  };
  console.log("Recognition initialized");
};

const speakResponse = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  const voices = synth.getVoices();
  const voice = voices.find(v => v.name.includes("Alex") || v.name.includes("Daniel")) || voices[0];
  utterance.voice = voice;
  synth.speak(utterance);
  if (isVideoActive) {
    console.log("Playing response video...");
    videoContainer.style.display = "block";
    avatarVideo.loop = true;
    avatarVideo.currentTime = 0;
    const playPromise = avatarVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Response video playing");
          avatarVideo.muted = false;
        })
        .catch(err => {
          console.error("Response video error:", err);
        });
    }
    utterance.onend = () => {
      avatarVideo.pause();
      avatarVideo.muted = true; 
      if (!isVideoActive) videoContainer.style.display = "none";
    };
  }
};

const speakGreeting = () => {
  if (!hasGreeted) {
    const greeting = "Hello! Welcome to the Loubby platform! I'm Loubby Navigator from Team Sigma, here to help you navigate our website.";
    const utterance = new SpeechSynthesisUtterance(greeting);
    utterance.rate = 1.0;
    const voices = synth.getVoices();
    const voice = voices.find(v => v.name.includes("Alex") || v.name.includes("Daniel")) || voices[0];
    utterance.voice = voice;
    if (isVideoActive) {
      console.log("Starting greeting video...");
      videoContainer.style.display = "block";
      avatarVideo.loop = true;
      avatarVideo.currentTime = 0;
      const playPromise = avatarVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Greeting video playing");
            avatarVideo.muted = false;
            synth.speak(utterance);
          })
          .catch(err => {
            console.error("Greeting video error:", err);
            synth.speak(utterance);
          });
      }
      utterance.onend = () => {
        avatarVideo.pause();
        avatarVideo.muted = true; // Mute after greeting
        if (!isVideoActive) videoContainer.style.display = "none";
      };
    } else {
      synth.speak(utterance);
    }
    hasGreeted = true;
  }
};

toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    localStorage.removeItem("chat-history");
    chatContainer.innerHTML = '';
    document.body.classList.remove("hide-header");
    hasGreeted = false;
    conversationStarted = false;
  }
});

feedbackBtn.addEventListener("click", () => {
  feedbackModal.style.display = "flex";
});

submitFeedbackBtn.addEventListener("click", () => {
  const rating = document.getElementById("rating").value;
  const comment = document.getElementById("comment").value;
  fetch("/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: parseInt(rating), comment })
  }).then(() => feedbackModal.style.display = "none");
});

micBtn.addEventListener("click", () => {
  console.log("Mic button clicked");
  if (!isMicActive && !isVideoActive) {
    isMicActive = true;
    micBtn.classList.add("active");
    console.log("Mic activated, isMicActive:", isMicActive);
    initializeRecognition();
    speakGreeting();
    recognition.start();
  } else {
    isMicActive = false;
    isVideoActive = false;
    micBtn.classList.remove("active");
    videoBtn.classList.remove("active");
    videoContainer.style.display = "none";
    recognition.stop();
    synth.cancel();
    avatarVideo.pause();
    avatarVideo.muted = true;
    console.log("Mic deactivated, isMicActive:", isMicActive);
  }
});

videoBtn.addEventListener("click", () => {
  console.log("Video button clicked");
  if (!isVideoActive && !isMicActive) {
    isVideoActive = true;
    videoBtn.classList.add("active");
    console.log("Video activated, isVideoActive:", isVideoActive);
    videoContainer.style.display = "block";
    avatarVideo.src = "/static/videos/avatar.mp4";
    avatarVideo.load();
    avatarVideo.muted = true; 
    if (!hasGreeted) {
      const playPromise = avatarVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Video playing successfully for greeting");
            speakGreeting();
            initializeRecognition();
            recognition.start();
          })
          .catch(err => {
            console.error("Video play failed:", err);
            isVideoActive = false;
            videoBtn.classList.remove("active");
            videoContainer.style.display = "none";
          });
      }
    } else {
     
      avatarVideo.currentTime = 0;
      avatarVideo.muted = true; // Ensure muted
      avatarVideo.pause(); // Ensure paused
      console.log("Video on, waiting for speech input");
      initializeRecognition();
      recognition.start();
    }
  } else {
    isVideoActive = false;
    isMicActive = false;
    micBtn.classList.remove("active");
    videoBtn.classList.remove("active");
    console.log("Video deactivated, isVideoActive:", isVideoActive);
    videoContainer.style.display = "none";
    recognition.stop();
    synth.cancel();
    avatarVideo.pause();
    avatarVideo.muted = true; 
  }
});

langSelect.addEventListener("change", () => {
  if (recognition) {
    recognition.lang = langSelect.value;
    if (isMicActive || isVideoActive) {
      recognition.stop();
      recognition.start();
    }
  }
});

suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, videoBtn:", videoBtn);
  console.log("Video container:", videoContainer);
  console.log("Avatar video:", avatarVideo);
  if (!videoBtn || !micBtn) {
    console.error("Video or Mic button not found in DOM");
  }
});

loadDataFromLocalstorage();