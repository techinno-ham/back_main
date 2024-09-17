(function() {
    // Function to initialize the chatbot
    async function initChatbot() {
        try {
            // Fetch the token if it's provided in the script tag's attributes
            var scriptTag = document.getElementById("myChatbotScript");
            var token = scriptTag ? scriptTag.getAttribute("data-token") : null;

            if (!token) {
                throw new Error("You must provide a non-empty data-token attribute.");
            }

            console.log(token, "tokenInScript");

            // Create the JSON payload
            var payload = {
                token: token,
            };

            // Fetch the collection data
            const response = await fetch(`https://hamyar.chat/api/widget/get-collection`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch collection data: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(data.collection, "token from backend");

            if (!data.collection) {
                throw new Error("Collection data is missing from the response.");
            }

            // Save token in localStorage
            window.localStorage.setItem("chat-bot-token", data.collection);

            // Create a container for the chatbot
            let container = document.createElement("div");
            container.id = "chatbotContainer";
            container.style.direction = "ltr";
            document.body.appendChild(container);

            // Load CSS
            var cssLink = document.createElement("link");
            cssLink.rel = "stylesheet";
            cssLink.href = `https://hamyar.chat/cdn/widget/v1.0.0/sourceWidget/main.css`;
            cssLink.onerror = function() {
                console.error("Failed to load CSS for chatbot.");
            };
            document.head.appendChild(cssLink);

            // Load JavaScript
            var jsScript = document.createElement("script");
            jsScript.src = `https://hamyar.chat/cdn/widget/v1.0.0/sourceWidget/main.js`;
            jsScript.onerror = function() {
                console.error("Failed to load JavaScript for chatbot.");
            };
            document.body.appendChild(jsScript);

        } catch (error) {
            console.error("Error initializing chatbot:", error);
            alert(`Chatbot initialization failed: ${error.message}`);
        }
    }

    // Execute the initialization function
    initChatbot();
})();
