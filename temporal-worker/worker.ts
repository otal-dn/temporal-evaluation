import {
  GracefulShutdownPeriodExpiredError,
  NativeConnection,
  Worker,
} from "@temporalio/worker";
import {
  importPackages,
  createStack,
  download,
  deploy,
  getConfig,
  setConfig,
  failureTask,
  rollbackImportPackages,
  rollbackCreateStack,
  rollbackDownload,
  rollbackDeploy,
  rollbackGetConfig,
  rollbackSetConfig,
  rollbackFailureTask,
} from "./tasks";

async function runWorker() {
  let logOutput = ""; // ✅ Store logs in a single string

  try {
    const temporalAddress = process.env.TEMPORAL_ADDRESS || "localhost:7233";
    const workerVersion = process.env.WORKER_VERSION || "1.0.0"; // Default to v1 if not set

    // ✅ Determine workflow version based on WORKER_VERSION
    const majorVersion = workerVersion.split(".")[0];
    const workflowsPath =
      majorVersion === "1"
        ? require.resolve("./workflows-v1")
        : require.resolve("./workflows-v2");

    logOutput += `🔹 Worker Version: ${workerVersion}\n`;
    logOutput += `🔹 Loading workflows from: ${workflowsPath}\n`;

    const connection = await NativeConnection.connect({
      address: temporalAddress, // Use environment variable for address
    });

    const worker = await Worker.create({
      shutdownForceTime: "30s", // ✅ Forcefully shut down after 30 seconds if tasks are still running
      workflowsPath,
      activities: {
        importPackages,
        createStack,
        download,
        deploy,
        getConfig,
        setConfig,
        failureTask,
        rollbackImportPackages,
        rollbackCreateStack,
        rollbackDownload,
        rollbackDeploy,
        rollbackGetConfig,
        rollbackSetConfig,
        rollbackFailureTask,
      },
      taskQueue: "default-task-queue",
      connection,
    });

    logOutput += `✅ Temporal Worker (v${workerVersion}) is running on ${temporalAddress}...\n`;
    console.log(logOutput); // ✅ Print only once

    // ✅ Handle SIGTERM to stop receiving tasks and log shutdown process
    const shutdownHandler = async () => {
      console.log("⚠️ Received SIGTERM. Stopping worker...");
      console.log(
        "🔄 Worker is now STOPPING... (No new tasks will be accepted)"
      );

      let state = worker.getState();
      console.log("Initial worker state:", state);

      await worker.shutdown(); // Wait for the shutdown to complete

      console.log("✅ Worker is now DRAINING... (Finishing current tasks)");
      console.log("✅ Worker has completely shut down.");
    };

    process.on("SIGTERM", shutdownHandler);
    process.on("SIGINT", shutdownHandler);

    await worker.run();
  } catch (error) {
    console.error("❌ Worker error:", error); // Still print errors immediately
    if (error instanceof GracefulShutdownPeriodExpiredError) {
      console.error("Forced shutdown initiated. Exiting process.");
      process.exit(1);
    } else {
      console.error("Unexpected error:", error);
      process.exit(1);
    }
  }
}

runWorker().catch((err) => console.error("Worker failed to start:", err));
