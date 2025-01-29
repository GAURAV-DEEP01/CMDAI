import { Primary, SessionSubCommand } from "./constants";

export interface CLIArgs {
    primary: Primary;
    subCommand?: SessionSubCommand;
    model?: string;
    prompt?: string;
    verbose?: boolean;
    version?: boolean;
    help?: boolean;
    commandStr?: string;
}
