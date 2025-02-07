import {
  ConfigSubCommand,
  Primary,
  SessionSubCommand,
} from '../util/constants';

export interface CLIArgs {
  primary: Primary;
  subCommand?: SessionSubCommand | ConfigSubCommand;
  model?: string;
  prompt?: string;
  verbose?: boolean;
  version?: boolean;
  help?: boolean;
  askString?: string;
  commandStr?: string;
  filePath?: string;
}
