import ollama from "ollama";

export default async function aiQuery(
  model: string,
  input: string,
  verbose: boolean
) {
  try {
    console.log(`Querying ${model} model...`);
    const response = await ollama.chat({
      model,
      messages: [{ role: "user", content: input }],
      stream: true,
    });
    let thinkingLogged = false;
    for await (const part of response) {
      if (verbose) {
        process.stdout.write(part.message.content);
      } else if (!thinkingLogged) {
        console.log("Thinking...");
        thinkingLogged = true;
      }
    }
  } catch (error) {
    console.error("Error querying Ollama:", error);
  }
}
