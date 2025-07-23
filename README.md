# CEL Rule Assistant Chat UI

A single-page React application that provides an AI-powered chat interface for generating and validating CEL (Common Expression Language) rules against Kubernetes clusters.

## Features

- **AI-Powered Rule Generation**: Describe what you want to validate in natural language, and the assistant generates appropriate CEL rules
- **Live Cluster Validation**: Test generated rules against your actual Kubernetes resources
- **Test Data Validation**: Validate rules against test data without touching your cluster
- **Interactive Learning**: Get examples and explanations of CEL syntax
- **Real-time Streaming**: See the assistant's thinking process and results as they happen

## Prerequisites

1. The CEL RPC server must be running on `http://localhost:8090`
2. Node.js and npm installed

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Running with Podman

You can run the pre-built container image using Podman:

### Pull and Run

```bash
# Pull the latest image
podman pull ghcr.io/vincent056/cel-rule-ui:latest

# Run with default settings (connects to localhost:8090)
podman run -p 8080:8080 ghcr.io/vincent056/cel-rule-ui:latest
```

### Custom RPC Server URL

If your CEL RPC server is running on a different host/port:

```bash
# Run with custom RPC server URL
podman run -p 8080:8080 \
  -e VITE_RPC_BASE_URL=http://your-server:8090 \
  ghcr.io/vincent056/cel-rule-ui:latest
```

### Using Podman Compose

Create a `compose.yml` file:

```yaml
services:
  cel-rule-ui:
    image: ghcr.io/vincent056/cel-rule-ui:latest
    ports:
      - "8080:8080"
    environment:
      - VITE_RPC_BASE_URL=http://localhost:8090
```

Then run:

```bash
podman-compose up
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
