---
title: "Ollama on bare metal: what actually runs"
date: "2025-04-18T20:14:00"
tags: ["OLLAMA", "HOMELAB"]
preview: "16GB RAM is enough for 8B models. Phi-3 Mini runs fine. Llama 3 70B needs a GPU. The quantized 4-bit version is barely usable at homelab speed."
---

16GB RAM handles 8B parameter models fine. Phi-3 Mini is fast. Llama 3 70B needs a GPU. The quantized 4-bit version is barely usable at homelab speed.

Hardware: one of the Lenovo M720q mini PCs, Intel Core i7-8700T, 16GB DDR4, no GPU.

What actually runs at usable speed:

- **Phi-3 Mini (3.8B):** ~15 tok/s. Fast enough to feel interactive.
- **Mistral 7B:** ~8 tok/s. Acceptable for anything non-time-sensitive.
- **Llama 3 8B:** ~7 tok/s. Same bracket as Mistral.

What doesn't:

- **Llama 3 70B Q4:** ~1.2 tok/s. Technically loads and runs, but a 200-word response takes four minutes. Not useful.
- **Llama 3 70B full precision:** exceeds available RAM. Ollama refuses to load it.

The one configuration change that made a meaningful difference was setting `OLLAMA_NUM_PARALLEL=1`. The default allows concurrent model requests, which causes each one to take longer when anything else is running. For solo use, serializing is strictly better than splitting the CPU across requests.
