import clc from 'cli-color';
import { marked, Tokens } from 'marked';
//@ts-ignore
import TerminalRenderer from 'marked-terminal';

class CustomTerminalRenderer extends TerminalRenderer {
  //@ts-ignore
  code(token: Tokens.Code): string {
    //@ts-ignore
    const { text, lang, escaped } = token;
    const language = lang?.trim() || 'code';
    const header = clc.bgWhite.black.bold(` ${language} `);
    const border = clc.white('────────────────');
    return `\n${header}${border}\n\n${super.code(token)}${border}\n\n`;
  }

  heading(token: Tokens.Heading): string {
    const { tokens, depth } = token;
    //@ts-ignore
    const text = this.parser.parseInline(tokens);
    let styledText: string;
    switch (depth) {
      case 1:
        styledText = clc.bold.underline(text);
        break;
      case 2:
        styledText = clc.bold(text);
        break;
      default:
        styledText = clc.underline(text);
        break;
    }
    return styledText + '\n';
  }

  em(token: Tokens.Em): string {
    const { tokens } = token;
    //@ts-ignore
    const text = this.parser.parseInline(tokens);
    return clc.italic(text);
  }

  del(token: Tokens.Del): string {
    const { tokens } = token;
    //@ts-ignore
    const text = this.parser.parseInline(tokens);
    return '\x1B[9m' + text + '\x1B[29m';
  }

  paragraph(token: Tokens.Paragraph): string {
    const { tokens } = token;
    //@ts-ignore
    const text = this.parser.parseInline(tokens);
    return text + '\n';
  }

  list(token: Tokens.List): string {
    const items = token.items
      .map((item: Tokens.ListItem) => {
        //@ts-ignore
        const text = this.parser.parseInline(item.tokens);
        return clc.yellowBright('• ') + text;
      })
      .join('\n');
    return items + '\n';
  }

  blockquote(token: Tokens.Blockquote): string {
    //@ts-ignore
    const content = this.parser.parse(token.tokens);
    return (
      content
        .split('\n')
        //@ts-ignore
        .map((line) => clc.cyanBright('> ') + line)
        .join('\n') + '\n'
    );
  }

  codespan(token: Tokens.Codespan): string {
    const { text } = token;
    return clc.bgBlack.white(` ${text} `);
  }

  //@ts-ignore
  link(token: Tokens.Link): string {
    //@ts-ignore
    const { href, title, tokens } = token;
    //@ts-ignore
    const text = this.parser.parseInline(tokens);
    return clc.blue.underline(text) + clc.blueBright(` (${href})`);
  }

  //@ts-ignore
  hr(token: Tokens.Hr): string {
    return clc.white('────────────────────────────────────────────') + '\n';
  }
}

marked.setOptions({
  silent: true,
  renderer: new CustomTerminalRenderer(),
} as any);

export default marked;
