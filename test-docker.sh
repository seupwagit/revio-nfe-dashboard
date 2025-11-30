#!/bin/bash

echo "🔨 Building Docker image..."
docker build -t revio-test .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🚀 Starting container..."
docker run -d --name revio-test-container -p 8080:3000 revio-test

if [ $? -ne 0 ]; then
    echo "❌ Container failed to start!"
    exit 1
fi

echo "✅ Container started!"
echo ""
echo "⏳ Waiting 5 seconds for container to be ready..."
sleep 5

echo ""
echo "🔍 Testing container..."
curl -I http://localhost:8080

echo ""
echo "📋 Container logs:"
docker logs revio-test-container

echo ""
echo "🧹 Cleaning up..."
docker stop revio-test-container
docker rm revio-test-container

echo ""
echo "✅ Test complete! If you saw a 200 OK response, the container works locally."
echo "   If it works locally but not on Coolify, check Coolify's proxy configuration."
