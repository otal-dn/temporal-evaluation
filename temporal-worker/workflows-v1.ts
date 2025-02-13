import {
  proxyActivities,
  defineSignal,
  setHandler,
  sleep,
  ApplicationFailure,
} from "@temporalio/workflow";
import type * as activities from "./tasks";

// ✅ Proxy activities so they can be used in the workflow
const {
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
} = proxyActivities<typeof activities>({
  retry: { maximumAttempts: 3 },
  startToCloseTimeout: "10 minutes",
});

// ✅ Define a signal for deployment completion
const deploymentCompleted = defineSignal("deploymentCompleted");

export interface WorkflowState {
  completedTasks: { name: string; result: string }[];
  failedTasks: { name: string; error: string }[];
}

// ✅ Main Workflow Function
export async function FullDeploymentWorkflow(): Promise<WorkflowState> {
  console.log(`🚀 Workflow "FullDeploymentWorkflow" started.`);

  let resolveSignal: (() => void) | null = null;
  let deploymentConfirmed = false;

  let completedTasks: { name: string; result: string }[] = [];
  let failedTasks: { name: string; error: string }[] = [];

  // ✅ Set up a signal handler for deployment completion
  setHandler(deploymentCompleted, () => {
    console.log(`✅ Received deployment completion signal! Resuming workflow.`);
    deploymentConfirmed = true;
    if (resolveSignal) resolveSignal();
  });

  try {
    console.log("🔹 Running `importPackages`...");
    const importResult = await importPackages([]);
    completedTasks.push({
      name: "importPackages",
      result: importResult.response,
    });

    console.log("🔹 Running `createStack`...");
    const createStackResult = await createStack([], "");
    completedTasks.push({ name: "createStack", result: createStackResult });

    console.log("🔹 Running `download`...");
    const downloadResult = await download("", "");
    completedTasks.push({ name: "download", result: downloadResult });

    console.log("🔹 Running `deploy`...");
    const deployResult = await deploy("");
    console.log(
      `⏳ Waiting for deployment completion signal "deploymentCompleted"...`
    );
    await new Promise<void>((resolve) => (resolveSignal = resolve)); // ✅ Wait for signal
    completedTasks.push({ name: "deploy", result: deployResult });

    console.log("🔹 Running `getConfig`...");
    const getConfigResult = await getConfig("");
    completedTasks.push({ name: "getConfig", result: getConfigResult });
  } catch (error) {
    console.error(`❌ Workflow task failed:`, error);
    failedTasks.push({
      name: "unknown",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  console.log(`🎉 Workflow execution completed.`);
  return { completedTasks, failedTasks };
}

async function compensate(compensations: any[], compensateInParallel = false) {
  if (compensateInParallel) {
    compensations.map((comp) =>
      comp().catch(() => console.error(`failed to compensate: $error`))
    );
  }
  for (const comp of compensations) {
    try {
      await comp();
    } catch (err) {
      console.error(`failed to compensate: ${err}`);
    }
  }
}

// ✅ Define a signal for manual approval
const approvalSignal = defineSignal("approvalSignal");

export async function FullDeploymentWorkflowWithRollback(
  signal = false
): Promise<void> {
  let signalReceived = false;
  let resolveSignal: (() => void) | null = null;

  // ✅ If signal-based wait is enabled, handle approval signal
  if (signal) {
    setHandler(approvalSignal, () => {
      console.log("✅ Approval signal received! Proceeding...");
      signalReceived = true;
    });
  }

  const compensations: any[] = [];
  try {
    compensations.unshift(rollbackImportPackages);
    await importPackages([]);
    compensations.unshift(rollbackCreateStack);
    await createStack([], "");
    compensations.unshift(rollbackDownload);
    await download("", "");
    compensations.unshift(rollbackDeploy);
    await deploy("");
    // ✅ If signal is enabled, wait for it with a timeout
    if (signal) {
      console.log("⏳ Waiting for external signal...");

      // ✅ Ensure workflow fails properly if signal is not received
      const timeoutPromise = sleep(10 * 1000).then(() => {
        console.error(
          "❌ Signal was NOT received within 10 seconds! Triggering rollback."
        );
        throw new Error(
          "SignalTimeoutError: Workflow failed due to missing approval signal."
        );
      });

      await Promise.race([
        new Promise<void>((resolve) => (resolveSignal = resolve)), // ✅ Resolves when signal is received
        timeoutPromise, // ✅ Throws error if timeout is reached
      ]);
    } else {
      compensations.unshift(rollbackFailureTask);
      await failureTask(); // 🚨 Default behavior if signal is disabled
    }
  } catch (err: unknown) {
    await compensate(compensations);
    const msg =
      (err as Error)?.message || "Workflow has FAILED after rollback.";
    throw ApplicationFailure.nonRetryable(msg); // ✅ Ensures workflow fully fails and STOPS
  }
}
