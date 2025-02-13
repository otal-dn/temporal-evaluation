# Temporal Evaluation

This repository contains tests and evaluations of Temporal's capabilities, performance metrics, and integration examples.

## Overview

[Temporal](https://temporal.io/) is a microservice orchestration platform that helps build reliable distributed applications. This repository documents various tests and evaluations conducted to assess:

- Core capabilities and features
- Performance benchmarks
- Integration patterns
- Best practices

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js and npm

### Installation & Setup

1. Clone the repository:

```bash
git clone https://github.com/otal-dn/temporal-evaluation.git
cd temporal-evaluation
```

2. Start the services using Docker Compose:

```bash
docker-compose up -d
```

This will start:

- Temporal Server
- Temporal Web UI
- PostgreSQL database
- Elasticsearch database
- Temporal Admin Tools

### Accessing Services

#### Temporal Web UI

- URL: http://localhost:8080
- Use this interface to monitor workflows, view execution history, and debug issues

#### API Documentation

The API documentation is available in OpenAPI v2 format:

- Visit [Swagger Editor](https://editor.swagger.io/)
- Import the file from `openapi/openapiv2.json`

The HTTP API is available on port 7243. Example usage:

```bash
# List workflows in the default namespace
curl http://localhost:7243/api/v1/namespaces/default/workflows
```

### Running the Worker

To start the Temporal worker:

```bash
cd temporal-worker
npm install
npm start
```

The worker will begin listening for tasks from the Temporal server.

To start the worker in a Docker container:

```bash
cd temporal-worker
./build-and-run.sh
```

### Testing Scenarios

#### Basic Happy Path

1. start a worker.
2. Start a workflow through the UI:
   - Workflow name: "FullDeploymentWorkflow"
   - Task queue: "default-task-queue"
3. Monitor the workflow as it executes deployment tasks
4. After deployment is completed, send the "deploymentCompleted" signal through the UI
5. Verify that the workflow completes successfully

#### Version Management Testing

1. Start a worker with version "v1":
   - Use the default version in build-and-run.sh (starts with "1")
2. Initiate "FullDeploymentWorkflow" through the UI using "default-task-queue"
3. Stop the current worker
4. Start a new worker with version "v2"
5. Observe that:
   - The new worker successfully resumes and completes the existing workflow of v1
   - Running another instance of "FullDeploymentWorkflow" uses the new version v2

#### Rollback Scenarios

There are two ways to test rollback functionality:

1. Automatic Failure:

   - Run "FullDeploymentWorkflowWithRollback"
   - The workflow will execute some tasks and then trigger a failure
   - Observe the automatic rollback process

2. Signal-Based Failure:
   - Run "FullDeploymentWorkflowWithRollback" with input parameter [true]
   - The workflow will execute tasks and wait for a signal
   - After a timeout period, it will fail and trigger the rollback process

#### Graceful Shutdown Testing

1. Start "FullDeploymentWorkflow" through the UI
2. Send a SIGTERM signal to the worker container:

```bash
docker kill --signal=SIGTERM <container_name>
```

3. Observe that:
   - The worker initiates a graceful shutdown
   - The workflow completes successfully
   - Worker logs show the state transitions during shutdown

## Additional Resources

### Temporal Documentation

Here are some essential Temporal resources to help you understand the concepts demonstrated in this evaluation:

1. Core Concepts:

   - [What is Temporal?](https://docs.temporal.io/concepts/what-is-temporal)
   - [Workflows](https://docs.temporal.io/concepts/what-is-a-workflow)
   - [Activities](https://docs.temporal.io/concepts/what-is-an-activity)
   - [Workers](https://docs.temporal.io/concepts/what-is-a-worker)

2. Developer Guide:

   - [TypeScript SDK Guide](https://docs.temporal.io/dev-guide/typescript)
   - [Workflow Versioning](https://docs.temporal.io/dev-guide/typescript/#versioning)
   - [Signal Handling](https://docs.temporal.io/develop/typescript/message-passing#signals)
   - [Failure detection](https://docs.temporal.io/develop/typescript#failure-detection)

3. Operations:

   - [Task Queues](https://docs.temporal.io/concepts/what-is-a-task-queue)
   - [Namespaces](https://docs.temporal.io/concepts/what-is-a-namespace)

4. Best Practices:
   - [Worker Performance](https://docs.temporal.io/dev-guide/worker-performance)
   - [Testing Workflows](https://docs.temporal.io/dev-guide/typescript/testing)
   - [Production Deployment](https://docs.temporal.io/production-deployment)

For more detailed information, visit the [Temporal Documentation](https://docs.temporal.io/).
