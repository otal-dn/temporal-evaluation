export async function importPackages(
  packageUrls: string[]
): Promise<{ response: string }> {
  console.log(`Importing packages from URLs: ${packageUrls.join(", ")}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { response: `Packages imported successfully` };
}

export async function rollbackImportPackages(
  packageUrls: string[]
): Promise<string> {
  console.log(`Rolling back package imports`);
  return "Packages import rollback completed";
}

export async function createStack(
  packageUrls: string[],
  stackName: string
): Promise<string> {
  console.log(
    `Creating stack: ${stackName} with packages: ${packageUrls.join(", ")}`
  );
  return `Stack ${stackName} created successfully`;
}

export async function rollbackCreateStack(stackName: string): Promise<string> {
  console.log(`Rolling back stack creation for: ${stackName}`);
  return `Stack ${stackName} deletion completed`;
}

export async function download(
  stackName: string,
  serialNumber: string
): Promise<string> {
  console.log(
    `Downloading stack: ${stackName} for serial number: ${serialNumber}`
  );
  return `Downloaded stack ${stackName} for serial number ${serialNumber}`;
}

export async function rollbackDownload(
  stackName: string,
  serialNumber: string
): Promise<string> {
  console.log(
    `Rolling back download for stack: ${stackName}, serial: ${serialNumber}`
  );
  return `Download rollback completed for ${stackName}`;
}

export async function deploy(serialNumber: string): Promise<string> {
  console.log(`Deploying to serial number: ${serialNumber}`);
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return `Deployment successful started for serial number ${serialNumber}!, should get "deploymentCompleted" signal`;
}

export async function rollbackDeploy(serialNumber: string): Promise<string> {
  console.log(`Rolling back deployment for serial: ${serialNumber}`);
  return `Deployment rollback completed for ${serialNumber}`;
}

export async function getConfig(systemId: string): Promise<string> {
  console.log(`Fetching configuration for system ID: ${systemId}`);
  return `Configuration retrieved for system ID: ${systemId}`;
}

export async function rollbackGetConfig(systemId: string): Promise<string> {
  console.log(`Rolling back configuration fetch for system ID: ${systemId}`);
  return `Configuration fetch rollback completed`;
}

export async function setConfig(
  systemId: string,
  configFileName: string
): Promise<string> {
  console.log(
    `Setting configuration for system ID: ${systemId} with file: ${configFileName}`
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `Configuration ${configFileName} set for system ID: ${systemId}`;
}

export async function rollbackSetConfig(
  systemId: string,
  configFileName: string
): Promise<string> {
  console.log(`Rolling back configuration set for system ID: ${systemId}`);
  return `Configuration set rollback completed`;
}

export async function failureTask(): Promise<void> {
  throw new Error("Task failed");
}

export async function rollbackFailureTask(): Promise<string> {
  console.log("Rolling back failure task");
  return "Failure task rollback completed";
}
