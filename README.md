# LLM GPU Memory Calculator

# Calculating GPU Memory for LLMs

To determine GPU requirements for serving LLMs (like Llama3 70B), we need to calculate the required GPU memory using this formula:

```
M = ((P × 4B) × (32/Q)) × 1.2
```

Where:
- `M` = GPU memory required (in GB)
- `P` = Number of model parameters
- `4B` = Bytes per parameter (4)
- `32` = Bits in 4 bytes
- `Q` = Quantization bits (16, 8, or 4)
- `1.2` = 20% overhead factor for additional GPU memory

### Example
For a 70B parameter model at 8-bit quantization:
```
M = ((70B × 4) × (32/8)) × 1.2 = 134.4 GB
```

## Run Scripts
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start development server


- `pnpm run lint` - Lint source files

 