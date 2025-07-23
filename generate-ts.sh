#!/bin/bash

echo "Installing TypeScript code generation tools..."

# Install required dependencies with compatible versions
npm install @bufbuild/buf@latest  
npm install --save-dev @bufbuild/protoc-gen-es@latest


npx @connectrpc/connect-migrate@latest



# Add node_modules/.bin to PATH for local binaries
export PATH="./node_modules/.bin:${PATH}"

echo "Generating TypeScript client code..."

# Create gen directory if it doesn't exist
mkdir -p server/gen

# Generate TypeScript code from proto files
echo "Generating from proto files..."
npx buf generate ../cel-rpc-server/proto/cel/v1/cel.proto \
  --template buf.gen.yaml

echo "TypeScript client code generated successfully!" 