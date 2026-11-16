# .git 体积治理报告（2026-11-16）

## 三步对照

| 步骤 | 操作 | .git 体积 | 说明 |
|------|------|-----------|------|
| 初始 | — | **192 MB** | 435 个松散对象 190.68 MiB，pack=0（从未 gc） |
| 第一步 | `git gc --aggressive --prune=now`（安全回收） | **38 MB** | 松散→pack delta 压缩，清悬挂对象；fsck 零损坏 |
| 第二步 | filter-repo 移除测试媒体 test.mp4/test1.mp4/test.png/test1.png/test2.png（用户批准的历史改写） | **24 MB** | 历史 0 处残留 |
| 第三步 | filter-repo 剔除全部媒体历史 + .gitignore 不再跟踪（用户指令「直接不进 .git」） | **640 KB** | demo.gif 与 001-005.png 从全部历史剔除并忽略 |

## 最终状态
- in-pack 342 对象 / 493 KiB，单 pack；`git fsck --full` 零损坏；28 提交全保留（哈希已重写）
- 工作区媒体文件保留（public/demo.gif、001-005.png），本地 README 预览不受影响
- 应用必需资源完好：favicon.svg / icon.ico / icons.svg / examples/test-all-blocks.bas
- 大媒体备份：`%TEMP%/vba-media-backup/`（original=原版、compressed=压缩版，gif 8.8MB@8fps480px、png 量化版 216KB）

## 后果与建议
1. **GitHub 上 README 图片将 404**（媒体不再入库）——建议：发布 Release 附件后把 README 图片 URL 改为 release 下载链接，或接受本地预览
2. **全部提交哈希已重写**（26→28 含报告提交）；推远端需 `git push --force`（origin/main 旧历史与新历史不同源）
3. 基线遗留（block_definitions_suggested.csv / task_plan.md 删除状态）保存在 stash@{0}（已随重写更新）
