import { pathToFileURL } from 'node:url';

export const isMain = url => Boolean(process.argv[1]) && url === pathToFileURL(process.argv[1]).href;
export const truthLabel = status => ({
  TRUE_ONLY: 'yes', FALSE_ONLY: 'no', NEITHER: 'unknown',
  BOTH: 'conflicting conclusions',
}[status] ?? String(status));
export const fields = rows => rows.map(([label, value]) => `  ${label.padEnd(9)} ${value}`).join('\n');

export function parseOptions(args, { allowAge = false, allowRent = false } = {}) {
  const options = { json: false, help: false, age: 20, rent: '0' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') options.json = true;
    else if (args[i] === '--help') options.help = true;
    else if (args[i] === '--age' && allowAge) {
      const value = args[++i];
      if (!/^\d+$/.test(value ?? '') || !Number.isSafeInteger(Number(value))) {
        throw Error('--age needs a non-negative whole number, for example --age 16.');
      }
      options.age = Number(value);
    } else if (args[i] === '--rent' && allowRent) {
      const value = args[++i];
      if (!/^\d+(?:\.\d{1,2})?$/.test(value ?? '')) {
        throw Error('--rent needs a non-negative EUR amount, for example --rent 300.');
      }
      options.rent = value;
    } else throw Error(`Unknown option: ${args[i]}. Use --help to see available options.`);
  }
  return options;
}

export async function runTerminal({ name, command, run, describe, allowAge = false, allowRent = false }) {
  let options;
  try {
    options = parseOptions(process.argv.slice(2), { allowAge, allowRent });
    if (options.help) {
      console.log(`${name}\n\n${command}${allowAge ? ' -- --age 20' : allowRent ? ' -- --rent 300' : ''}\n${command} -- --json\n\n${allowAge ? '--age N  Supply a different age fact.\n' : ''}${allowRent ? '--rent N Change the rent fact in EUR.\n' : ''}--json   Print the result summary and full hashes as JSON.\n--help   Show these commands.`);
      return;
    }
    const result = await run(options);
    console.log(options.json ? JSON.stringify(result, null, 2) : describe(result));
  } catch (error) {
    const message = error.message;
    if (options?.json || process.argv.slice(2).includes('--json')) console.error(JSON.stringify({ error: message }));
    else {
      console.error(`${name} could not run.\n\n${message}`);
      console.error(message.startsWith('--age') || message.startsWith('--rent') || message.startsWith('Unknown option')
        ? `\nTry: ${command} -- --help`
        : '\nCheck the example installation with npm ci --ignore-scripts.\nFor package load problems, see docs/compatibility.md.');
    }
    process.exitCode = 1;
  }
}

export function describeRule(result) {
  return ['Your first rule', fields([
    ['Rule', result.rulesApplied.join(', ') || 'examples/age.law'],
    ['Input', `Alice, age ${result.age}`],
    ['Answer', `adult = ${truthLabel(result.truthStatus)}`],
    ['Why', result.rulesApplied.length ? `Applied ${result.rulesApplied.join(', ')}` : 'No applicable rule'],
    ['Missing', result.missingAge === 'NEITHER' ? 'unknown (no age fact)' : truthLabel(result.missingAge)],
    ['Replay', result.replayIdentical ? 'identical evaluation bytes' : 'evaluation bytes differ'],
  ]), '', 'Try another input: npm start -- --age 16',
    'Edit the rule:     examples/age.law', 'Inspect the JSON:  npm --silent start -- --json'].join('\n');
}

export function describeCompiler(result) {
  return ['Check and compile a rule', fields([
    ['Source', 'examples/age.law'],
    ['Typo', `${result.typoDiagnostic}: aeg is not declared`],
    ['Fix', 'aeg -> age'],
    ['Check', result.fixedCheck ? 'passed' : 'failed'],
    ['Compile', `canonical model produced (${result.semanticVersion})`],
  ]), '', 'Inspect the JSON: npm --silent run example:compiler -- --json'].join('\n');
}

export function describeBenefits(result) {
  return ['French housing-aid formula', fields([
    ['Model', result.model], ['Case date', result.legalTime],
    ['Rent', `${result.rent} EUR`],
    ['Input', `${result.factCount} explicit demonstration facts`],
    ['Answer', `${result.formulaAmount} ${result.currency} (formula amount)`],
    ['Evidence', 'canonical evaluation document and result hash attached'],
  ]), '', 'Change the rent:     npm run example:benefits -- --rent 300',
    'Case and next steps: docs/run-a-model.md',
    'Inspect the JSON:    npm --silent run example:benefits -- --json'].join('\n');
}
