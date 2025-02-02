import { Primary, SessionSubCommand } from "../util/constants";

export interface cliArgs {
    primary: Primary;
    subCommand?: SessionSubCommand;
    model?: string;
    prompt?: string;
    verbose?: boolean;
    version?: boolean;
    help?: boolean;
    commandStr?: string;
}
