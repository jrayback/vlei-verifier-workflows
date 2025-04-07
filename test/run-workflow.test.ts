import path from 'path';
import {
  resolveEnvironment,
  TestEnvironment,
} from '../src/utils/resolve-env.js';
import { getConfig } from '../src/utils/test-data.js';
import { WorkflowRunner } from '../src/utils/run-workflow.js';
import { strict as assert } from 'assert';
import { loadWorkflow } from '../src/utils/test-data.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let env: TestEnvironment;

afterAll((done) => {
  done();
});
beforeAll((done) => {
  done();
  env = resolveEnvironment();
});

test.only('workflow', async function run() {
  const workflowsDir = '../src/workflows/';
  const workflowFile = env.workflow;
  const workflow = loadWorkflow(
    path.join(__dirname, `${workflowsDir}${workflowFile}`)
  );
  const configFileName = env.configuration;
  const dirPath = '../src/config/';
  const configFilePath = path.join(__dirname, dirPath) + configFileName;
  const configJson = await getConfig(configFilePath);
  if (workflow && configJson) {
    const wr = new WorkflowRunner(workflow, configJson);
    const workflowRunResult = await wr.runWorkflow();
    assert.equal(workflowRunResult, true);
  }
}, 3600000);
