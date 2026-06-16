import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Capability tags. Categories help group them in the UI later.
const FEATURES: { name: string; category: string }[] = [
  { name: "vision", category: "modality" },
  { name: "audio", category: "modality" },
  { name: "image-generation", category: "modality" },
  { name: "function-calling", category: "capability" },
  { name: "coding", category: "capability" },
  { name: "reasoning", category: "capability" },
  { name: "long-context", category: "capability" },
  { name: "fast", category: "performance" },
  { name: "open-source", category: "licensing" },
  { name: "fine-tunable", category: "licensing" },
];

// A few representative models. `features` lists Feature names to link via AIModelFeature.
const MODELS: {
  name: string;
  provider: string;
  tagline: string;
  description: string;
  contextWindow: number;
  pricing: string;
  features: string[];
}[] = [
  {
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    tagline: "Deep reasoning, agentic coding, careful and thorough.",
    description:
      "Anthropic's most capable model, strong at long-horizon reasoning, coding, and tool use.",
    contextWindow: 200000,
    pricing: "premium",
    features: ["coding", "reasoning", "long-context", "function-calling", "vision"],
  },
  {
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    tagline: "Fast and affordable, still sharp.",
    description: "A lightweight Claude model tuned for speed and cost-sensitive workloads.",
    contextWindow: 200000,
    pricing: "low",
    features: ["fast", "function-calling", "coding", "long-context"],
  },
  {
    name: "GPT-style Frontier Model",
    provider: "OpenAI",
    tagline: "Broad general-purpose multimodal assistant.",
    description: "A widely-used frontier model with strong multimodal and tool-use abilities.",
    contextWindow: 128000,
    pricing: "premium",
    features: ["vision", "audio", "function-calling", "reasoning", "coding"],
  },
  {
    name: "Gemini-style Multimodal Model",
    provider: "Google",
    tagline: "Massive context window and native multimodality.",
    description: "A multimodal model known for very large context windows.",
    contextWindow: 1000000,
    pricing: "mid",
    features: ["vision", "audio", "long-context", "function-calling"],
  },
  {
    name: "Llama-style Open Model",
    provider: "Meta",
    tagline: "Open weights you can self-host and fine-tune.",
    description: "An open-source model family that can be run locally and fine-tuned.",
    contextWindow: 128000,
    pricing: "free",
    features: ["open-source", "fine-tunable", "coding", "fast"],
  },
];

async function main() {
  // Upsert features and keep a name -> id map.
  const featureIds = new Map<string, string>();
  for (const f of FEATURES) {
    const rec = await prisma.feature.upsert({
      where: { name: f.name },
      update: { category: f.category },
      create: { name: f.name, category: f.category },
    });
    featureIds.set(f.name, rec.id);
  }

  // Create models with their feature links.
  for (const m of MODELS) {
    const existing = await prisma.aIModel.findFirst({ where: { name: m.name } });
    if (existing) continue;

    await prisma.aIModel.create({
      data: {
        name: m.name,
        provider: m.provider,
        tagline: m.tagline,
        description: m.description,
        contextWindow: m.contextWindow,
        pricing: m.pricing,
        features: {
          create: m.features.map((name) => ({
            feature: { connect: { id: featureIds.get(name)! } },
          })),
        },
      },
    });
  }

  const featureCount = await prisma.feature.count();
  const modelCount = await prisma.aIModel.count();
  console.log(`Seeded ${featureCount} features and ${modelCount} AI models.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
