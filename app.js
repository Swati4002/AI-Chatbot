const chatbox = document.getElementById("chatbox");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearButton");
const chatId = crypto.randomUUID();
let websocket = null;
let receiving = false;

const systemPrompt =
  "You are AI Chatot, a street racer and skilled mechanic known for your loyalty to family and friends.";

function createMessageElement(text, alignment) {
  const messageRow = document.createElement("div");
  messageRow.className = `message-row ${
    alignment === "left" ? "message-bot" : "message-user"
  }`;

  const icon = document.createElement("img");
  icon.src =
    alignment === "left"
      ? "https://cdn-icons-png.flaticon.com/512/4712/4712035.png" // Bot icon
      : "https://xsgames.co/randomusers/assets/avatars/male/25.jpg"; // User icon
  icon.alt = alignment === "left" ? "Bot" : "User";
  icon.className = "message-icon";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  if (alignment === "left") {
    messageRow.appendChild(icon);
    messageRow.appendChild(bubble);
  } else {
    messageRow.appendChild(bubble);
    messageRow.appendChild(icon);
  }

  return messageRow;
}

function connectWebSocket(message, initChat) {
  receiving = true;
  sendButton.textContent = "Cancel";
  const url = "wss://backend.buildpicoapps.com/api/chatbot/chat";
  websocket = new WebSocket(url);

  websocket.addEventListener("open", () => {
    websocket.send(
      JSON.stringify({
        chatId: chatId,
        appId: "ahead-less",
        systemPrompt: systemPrompt,
        message: initChat
          ? "A very short welcome message from Dominic Toretto"
          : message,
      })
    );
  });

  const messageElement = createMessageElement("", "left");
  chatbox.appendChild(messageElement);
  chatbox.scrollTop = chatbox.scrollHeight;

  websocket.onmessage = (event) => {
    messageElement.textContent += event.data;
    chatbox.scrollTop = chatbox.scrollHeight;
  };

  websocket.onclose = (event) => {
    if (event.code === 1000) {
      receiving = false;
      sendButton.textContent = "Ask Bot!";
    } else {
      messageElement.textContent +=
        "Error getting response from server. Refresh the page and try again.";
      chatbox.scrollTop = chatbox.scrollHeight;
      receiving = false;
      sendButton.textContent = "Ask Bot!";
    }
  };
}

function createWelcomeMessage() {
  connectWebSocket("", true);
}

sendButton.addEventListener("click", () => {
  if (!receiving && messageInput.value.trim() !== "") {
    const messageText = messageInput.value.trim();
    messageInput.value = "";
    const messageElement = createMessageElement(messageText, "right");
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;

    connectWebSocket(messageText, false);
  } else if (receiving && websocket) {
    websocket.close(1000);
    receiving = false;
    sendButton.textContent = "Ask Bot!";
  }
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !receiving && messageInput.value.trim() !== "") {
    event.preventDefault();
    sendButton.click();
  }
});

clearButton.addEventListener("click", () => {
  chatbox.innerHTML = "";
});

createWelcomeMessage();

function saveChatHistory() {
  const messages = Array.from(chatbox.children).map((msg) => ({
    text: msg.querySelector("div")?.textContent || "",
    sender: msg.classList.contains("justify-end") ? "user" : "bot",
  }));
  localStorage.setItem("chatHistory", JSON.stringify(messages));
}

function loadChatHistory() {
  const history = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  history.forEach((msg) => {
    const element = createMessageElement(
      msg.text,
      msg.sender === "user" ? "right" : "left"
    );
    chatbox.appendChild(element);
  });
}

// Save chat every time a message is added
saveChatHistory();

// Load on page load
loadChatHistory();
