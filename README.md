# CEL Rule Assistant Chat UI

A single-page React application that provides an AI-powered chat interface for generating and validating CEL (Common Expression Language) rules against Kubernetes clusters.

## Features

- **AI-Powered Rule Generation**: Describe what you want to validate in natural language, and the assistant generates appropriate CEL rules
- **Live Cluster Validation**: Test generated rules against your actual Kubernetes resources
- **Test Data Validation**: Validate rules against test data without touching your cluster
- **Interactive Learning**: Get examples and explanations of CEL syntax
- **Real-time Streaming**: See the assistant's thinking process and results as they happen

## Prerequisites

1. The CEL RPC server must be running (default: `http://localhost:8349`)
   - Backend server repository: https://github.com/vincent056/cel-rpc-server

2. Node.js and npm installed

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Quick Start with Docker/Podman

The easiest way to run the Chat UI is using the provided script:

```bash
# Run with default settings (connects to localhost:8349)
./run-dev.sh

# Run with custom RPC server URL
./run-dev.sh http://your-rpc-server:8349

# Run with custom RPC server URL and port
./run-dev.sh http://your-rpc-server:8349 8080
```

## Running with Docker/Podman (Manual)

### Development Mode

For development and testing, you can build and run the UI with hot-reload:

```bash
# Build the development image
podman build -t cel-chat-ui:dev .

# Run with default settings (connects to localhost:8349)
podman run -p 5173:5173 --name cel-chat-ui cel-chat-ui:dev

# Run with custom RPC server URL (environment variable is picked up at runtime)
podman run -p 5173:5173 --name cel-chat-ui --replace \
  -e VITE_RPC_BASE_URL=http://your-server:8349 \
  cel-chat-ui:dev

# Example: Connect to RPC server running in another container
podman run -p 5173:5173 --name cel-chat-ui \
  -e VITE_RPC_BASE_URL=http://host.containers.internal:8349 \
  cel-chat-ui:dev

# Example: Connect to RPC server on a different host
podman run -p 5173:5173 --name cel-chat-ui \
  -e VITE_RPC_BASE_URL=http://192.168.1.100:8349 \
  cel-chat-ui:dev
```

The development server will show the configured URL in the startup logs:
```
Starting development server with:
  VITE_RPC_BASE_URL=http://your-server:8349
```

Access the UI at `http://localhost:5173`

### Production Mode (Pre-built)

You can also run the pre-built production container image:

```bash
# Pull the latest image
podman pull ghcr.io/vincent056/cel-rule-ui:latest

# Run with default settings (connects to localhost:8090)
podman run -p 8080:8080 ghcr.io/vincent056/cel-rule-ui:latest

# Run with custom RPC server URL
podman run -p 8080:8080 \
  -e VITE_RPC_BASE_URL=http://your-server:8090 \
  ghcr.io/vincent056/cel-rule-ui:latest
```

## Complete System Setup (Backend + Frontend)

The CEL Rule Assistant consists of two components:

1. **Backend Server (cel-rpc-server)**: AI-powered CEL rule generation server
   - Repository: https://github.com/vincent056/cel-rpc-server
   - Location: `../cel-rpc-server/`
   - Default port: 8349

2. **Frontend UI (chat-ui)**: React-based chat interface
   - Repository: [current repository]
   - Location: `./`
   - Default port: 5173

### Running Both Components

#### Option 1: Using Containers
```bash
# Terminal 1: Start the backend server
cd ../cel-rpc-server
podman run -d --name cel-rpc-server \
  -p 8349:8349 \
  -e OPENAI_API_KEY=your-api-key \
  -v ~/.kube/config:/KUBECONFIG/kubeconfig:Z \
  ghcr.io/vincent056/cel-rpc-server

# Terminal 2: Start the frontend UI
cd ../chat-ui
./run-dev.sh http://localhost:8349
```

#### Option 2: Running Locally
```bash
# Terminal 1: Start the backend server
cd ../cel-rpc-server
export OPENAI_API_KEY=your-api-key
go run cmd/server/*.go

# Terminal 2: Start the frontend UI
cd ../chat-ui
npm install
npm run dev
```

### Build Locally with Podman

```bash
# Build the image
podman build -t cel-rule-ui .

# Run your local build
podman run -p 8080:8080 cel-rule-ui
```

The application will be available at `http://localhost:8080`.

## Usage

### General Chat Mode
Ask questions about CEL rules, get examples, or learn about syntax:
- "Show me examples of CEL rules"
- "How do I check if a pod has resource limits?"
- "What is CEL syntax?"

### Rule Generation Mode
1. Select "Rule Generation" mode
2. Choose the resource type (Pod, Deployment, Service, etc.)
3. Specify the namespace (optional)
4. Describe what you want to validate
5. The assistant will generate a CEL rule and optionally validate it against your cluster

Example prompts:
- "Ensure all pods have resource limits"
- "Check if deployments have at least 2 replicas"
- "Validate that services have proper labels"

### Test Validation Mode
Test CEL rules against JSON test data without affecting your cluster.

## Architecture

- **Frontend**: React with TypeScript using Vite
- **Communication**: Server-Sent Events (SSE) for streaming responses
- **Backend**: Connect RPC server with AI integration

## Development

The app uses a simple fetch-based approach to communicate with the server's streaming endpoint. The server handles:
- LLM integration for rule generation
- CEL rule validation
- Kubernetes resource discovery
- Streaming responses back to the client

## Customization

You can modify:
- `src/App.tsx`: Main chat interface logic
- `src/App.css`: Styling and themes
- Resource types in the dropdown
- Default namespace and validation options
