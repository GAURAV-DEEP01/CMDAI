import clc from "cli-color";

export function printErr(msg: string) {
  process.stderr.write(`${clc.red("Error:")} ${msg}\n`)
  process.exit(1);
}

