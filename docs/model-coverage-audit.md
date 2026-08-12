# Model Coverage Audit（模型覆盖审计）

- **Date**: 2026-08-12
- **Phase**: 12.1 Part A

## 当前模型统计（audit 时点：12.1 前）

```
total models:       49
providers:          14
verified:           29（59%）
unverified:         20（41%，诚实标注）
missing source:     0（pricing/benchmark/capability 均映射）
missing pricing:    部分历史模型无定价（NULL）
missing benchmark:  全部（demo 数据诚实标注 Internal Demo）
```

## Provider 覆盖（按 provider）

| Provider | 模型数（12.1 前） | 12.1 后 |
| --- | --- | --- |
| OpenAI | 9 | 14 |
| Anthropic | 7 | 11 |
| Google | 7 | 11 |
| Meta | 2 | 6 |
| DeepSeek | 4 | 9 |
| Zhipu | 2 | **8（GLM-4/4.5/4.6/5/5.2 等）** |
| Alibaba | 3 | 9 |
| Moonshot | 3 | 6 |
| MiniMax | 1 | 4 |
| Mistral | 3 | 6 |
| Baidu / ByteDance / Tencent / xAI | 1 各 | 2-3 各 |

## 缺口（12.1 解决）

1. Zhipu GLM 系列不足（2 → 8）
2. 历史版本缺失（GPT-3.5/4-turbo、Claude 2/3、Gemini 1.5 等）
3. 无 release tracking / replacement 关系
4. Provider 注册信息不全（slug/country/官方 URL）
