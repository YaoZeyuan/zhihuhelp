# 知乎测试 Fixture

- `sources.json` 维护在线冒烟和显式采集使用的公开样本；`online: false` 的样本只用于可选人工检查。
- `errors/` 是完全离线的错误语义样本，用于区分空列表、已删除和 404。
- `online/` 只能由 `pnpm fixtures:refresh` 更新。每个文件只保留稳定字段，并带有内容 SHA-256 校验值。
- 普通 `pnpm test` 不读取根目录 `config.json`，也不会访问这些 URL。
