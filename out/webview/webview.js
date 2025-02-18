(function() {
    console.log('Webview script starting...');
    try {
        if (typeof acquireVsCodeApi === 'undefined') {
            console.error('acquireVsCodeApi is not defined');
            throw new Error('acquireVsCodeApi is not defined');
        }

        const vscode = acquireVsCodeApi();
        console.log('VS Code API acquired');
        
        // Get DOM elements
        const chatContainer = document.getElementById('chat-container');
        const questionInput = document.getElementById('question-input');
        const addContextBtn = document.getElementById('add-context-btn');
        const sendBtn = document.getElementById('send-btn');
        const attachedFiles = new Set();

        if (!chatContainer || !questionInput || !addContextBtn || !sendBtn) {
            console.error('Failed to find required DOM elements:', {
                chatContainer: !!chatContainer,
                questionInput: !!questionInput,
                addContextBtn: !!addContextBtn,
                sendBtn: !!sendBtn
            });
            throw new Error('Required DOM elements not found');
        }

        console.log('DOM elements initialized');
        
        // Add messages to the chat
        function addMessage(type, content) {
            console.log('Adding message:', type, content);
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type + '-message';
            messageDiv.textContent = content;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Send a message
        function sendMessage() {
            const question = questionInput.value.trim();
            console.log('Attempting to send message:', question);
            if (question) {
                addMessage('user', question);
                vscode.postMessage({ 
                    command: 'askQuestion',
                    text: question 
                });
                questionInput.value = '';
            }
        }

        // Update file display
        function updateAttachedFiles() {
            const filesDiv = document.getElementById('attached-files');
            const filesList = document.getElementById('files-list');
            
            filesList.innerHTML = '';
            
            if (attachedFiles.size > 0) {
                filesDiv.classList.add('has-files');
                
                attachedFiles.forEach((file) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    
                    const fileIcon = document.createElement('span');
                    fileIcon.className = 'file-icon';
                    fileIcon.textContent = '📄';
                    
                    const fileName = document.createElement('span');
                    fileName.className = 'file-name';
                    fileName.textContent = file.split(/[\\/]/).pop() || file;
                    
                    const removeButton = document.createElement('button');
                    removeButton.className = 'remove-file';
                    removeButton.title = 'Remove file';
                    removeButton.textContent = '×';
                    removeButton.onclick = () => removeFile(file);
                    
                    fileItem.appendChild(fileIcon);
                    fileItem.appendChild(fileName);
                    fileItem.appendChild(removeButton);
                    filesList.appendChild(fileItem);
                });
            } else {
                filesDiv.classList.remove('has-files');
            }
        }

        // Clear all files
        function clearAllFiles() {
            attachedFiles.clear();
            updateAttachedFiles();
            vscode.postMessage({ command: 'clearFiles' });
        }

        // Add click handlers
        sendBtn.addEventListener('click', () => {
            console.log('Send button clicked');
            sendMessage();
        });

        addContextBtn.addEventListener('click', () => {
            console.log('Add context button clicked');
            vscode.postMessage({ command: 'pickFiles' });
        });

        // Add enter key handler
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                console.log('Enter key pressed');
                e.preventDefault();
                sendMessage();
            }
        });

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Received message from extension:', message);
            
            if (message.type === 'response') {
                addMessage('ai', message.content);
            } else if (message.type === 'fileAttached') {
                attachedFiles.add(message.fileName);
                updateAttachedFiles();
            }
        });

        // Add initial message
        addMessage('ai', 'Assistant is ready. How can I help you?');

        // Simple test message
        vscode.postMessage({ command: 'test', text: 'Basic test' });
        console.log('Initial setup complete');

        console.log('Webview script initialization complete');
    } catch (error) {
        console.error('Failed to initialize webview:', error);
    }
})(); 