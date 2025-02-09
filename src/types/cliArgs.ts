import { ConfigSubCommand, Primary } from './constants';

export interface CLIArgs {
  primary: Primary;
  subCommand?: ConfigSubCommand;
  model?: string;
  prompt?: string;
  verbose?: boolean;
  version?: boolean;
  help?: boolean;
  askString?: string;
  commandStr?: string;
  pipedStr?: string;
  filePath?: string;
}
