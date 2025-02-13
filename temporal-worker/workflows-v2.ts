import {
  proxyActivities,
  defineSignal,
  setHandler,
  patched,
  deprecatePatch,
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

// ✅ Workflow Execution (v2)
export async function FullDeploymentWorkflow(): Promise<void> {
  console.log("🚀 Workflow started.");

  let resolveSignal: (() => void) | null = null;
  setHandler(deploymentCompleted, () => {
    console.log("✅ Deployment completion signal received.");
    if (resolveSignal) resolveSignal();
  });

  // ✅ Step 1: Apply Patch **Early** to Store it in Workflow History
  const isV2 = patched("replace-getConfig-with-setConfig");

  console.log(
    `🔹 Workflow version detected: ${
      isV2 ? "V2 (setConfig)" : "V1 (getConfig)"
    }`
  );

  console.log("🔹 Running `importPackages`...");
  await importPackages([]);

  console.log("🔹 Running `createStack`...");
  await createStack([], "");

  console.log("🔹 Running `download`...");
  await download("", "");

  console.log("🔹 Running `deploy`...");
  await deploy("");
  console.log("⏳ Waiting for deployment completion signal...");
  await new Promise<void>((resolve) => (resolveSignal = resolve));

  // ✅ Versioning logic: `getConfig` for old workflows, `setConfig` for new workflows
  if (!isV2) {
    console.log("🔄 Running `getConfig` (Old v1 Workflow)...");
    await getConfig("");
  } else {
    console.log("✅ Running `setConfig` (New v2 Workflow)...");
    await setConfig("", "config.yaml");
  }

  console.log("🎉 Workflow execution completed.");
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
