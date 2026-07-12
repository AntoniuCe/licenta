FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    git \
    gcc \
    && rm -rf /var/lib/apt/lists/*

    
# Install Go
RUN wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz && \
    rm go1.22.0.linux-amd64.tar.gz

# Set Go environment variables
ENV CGO_ENABLED=0
ENV PATH=$PATH:/usr/local/go/bin
ENV GOPATH=/go
ENV PATH=$PATH:$GOPATH/bin
ENV GOOS=linux
ENV GOARCH=arm64

# Create workspace
WORKDIR /app

# Copy your application
COPY . .

# Show what we have
RUN echo "=== Current directory contents ===" && ls -la
RUN echo "=== Go version ===" && go version
RUN echo "=== go.mod content ===" && cat go.mod

# Download dependencies and build
RUN go mod tidy
RUN go build -o main ./cmd

# Expose port
EXPOSE 8080

# Run the app
CMD ["./main"]