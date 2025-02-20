# KSCode AI Assistant

A VS Code extension that provides an AI-powered coding assistant using Ollama's DeepSeek model. This extension integrates directly into your VS Code environment, offering contextual code assistance, explanations, and suggestions.

## Features

- **AI Chat Interface**: Interact with the AI assistant directly within VS Code
- **Context-Aware Responses**: Attach files to provide context for more accurate assistance
- **Split View Integration**: Automatically splits your editor, keeping code and AI assistance side by side
- **File Context Management**: 
  - Add multiple files as context
  - View attached files in the UI
  - Remove individual files or clear all context

## TODO

- [ ] UX guidelines
- [ ] Integration tests
- [ ] Publish
- [ ] CI

## Requirements

- VS Code version 1.97.0 or higher
- Node.js (for extension development)
- [Ollama](https://ollama.ai/) installed and running locally
- DeepSeek model pulled in Ollama (`ollama pull deepseek-r1:1.5b`)

## Installation

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull the DeepSeek model:
   ```bash
   ollama pull deepseek-r1:1.5b
   ```
3. Install the extension from VS Code Marketplace (or load from source)
4. Ensure Ollama is running (`ollama serve`)

## Usage

1. Open the AI Assistant panel:
   - Click the AI icon in the activity bar, or
   - Use the command palette (`Ctrl+Shift+P`) and search for "Open AI Assistant Panel"

2. Ask questions:
   - Type your question in the input box
   - Press Enter or click the send button

3. Add context:
   - Click the "Add context" button
   - Select one or more files
   - The AI will consider these files when answering questions

## Extension Settings

This extension contributes the following settings:

* `kscodes.modelName`: The Ollama model to use (default: 'deepseek-r1:1.5b')
* `kscodes.ollamaUrl`: URL of the Ollama server (default: 'http://localhost:11434')

## Known Issues

- Requires Ollama to be running locally
- Large files may take longer to process
- Currently only supports text-based files for context

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run compile
   ```
4. Press F5 to start debugging

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Release Notes

### 0.0.1

Initial release of KSCode AI Assistant:
- Basic chat interface
- File context support
- Split view integration
- DeepSeek model integration

---

## Acknowledgments

- Built with [Ollama](https://ollama.ai/)
- Uses the DeepSeek model
