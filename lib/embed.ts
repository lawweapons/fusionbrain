const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3-large";
const DIM = 1024;

export type InputType = "document" | "query";

export async function embed(texts: string[], inputType: InputType): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: texts,
      model: MODEL,
      input_type: inputType,
      output_dimension: DIM
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return data.data.map((d) => d.embedding);
}
