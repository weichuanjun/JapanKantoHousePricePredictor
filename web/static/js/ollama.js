document.addEventListener('DOMContentLoaded', function () {
    var queryForm = document.getElementById('queryForm');
    var promptInput = document.getElementById('prompt');
    var responseContainer = document.getElementById('responseContainer');

    if (!queryForm || !promptInput || !responseContainer) {
        console.error("Ollama query form elements are missing");
        return;
    }

    function ensureMarkedLoaded(callback) {
        if (typeof marked !== 'undefined') {
            callback();
        } else {
            setTimeout(function () { ensureMarkedLoaded(callback); }, 50);
        }
    }

    queryForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const prompt = promptInput.value;

        responseContainer.innerHTML = '';  // 清空之前的响应

        const eventSource = new EventSource(`/query?prompt=${encodeURIComponent(prompt)}`);
        let currentMessage = "";

        eventSource.onmessage = function (event) {
            const decodedMessage = event.data.replace(/\\u([\dA-F]{4})/gi, function (match, grp) {
                return String.fromCharCode(parseInt(grp, 16));
            });

            currentMessage += decodedMessage;

            ensureMarkedLoaded(function () {
                const htmlContent = marked.parse(currentMessage);
                const responseEntry = document.createElement('div');
                responseEntry.classList.add('response-entry');
                responseEntry.innerHTML = htmlContent;
                responseContainer.innerHTML = '';
                responseContainer.appendChild(responseEntry);
            });
        };

        eventSource.onerror = function () {
            ensureMarkedLoaded(function () {
                const htmlContent = marked.parse(currentMessage);
                const responseEntry = document.createElement('div');
                responseEntry.classList.add('response-entry');
                responseEntry.innerHTML = htmlContent;
                responseContainer.innerHTML = '';
                responseContainer.appendChild(responseEntry);
            });

            eventSource.close();
        };

        fetch('/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });
    });
});