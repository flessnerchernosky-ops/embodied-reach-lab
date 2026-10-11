# embodied-reach-lab · 机械臂怎样从画面找目标？

[English](README.en.md) · [打开演示](https://flessnerchernosky-ops.github.io/embodied-reach-lab/?lang=zh) · [实验路线](ROADMAP.md)

给机械臂一条颜色指令，让它从合成相机画面里找目标、计算关节动作并靠近目标。比较“所有同色像素的中心”和“最大连通色块”的差别。这个小实验把感知错误转化成真实的动作偏差，是学习具身交互的一块起点。

![真实默认仿真轨迹](docs/preview.gif)

**无需硬件、注册或付费。** 下载仓库后直接打开 `docs/index.html`，或使用在线演示；界面和指南均为中英双语。浏览器不向服务器上传实验数据，CSV 在本机生成。

## 3 分钟开始

1. 打开演示，点击“运行到底”，看两种方法的分数。
2. 只改变一个参数，例如延迟，然后重跑；场景切换会重置实验轨迹，语言切换会保留结果。
3. 下载 CSV，写一句带证据的结论。完整运行才能导出，元数据包括设置、步长和完成状态。

## 一组真实结果

默认 distractor、零延迟、红色指令，未删除初始过程：

| 方法 Method | 全程 RMSE / Full-run RMSE (m) | 末段 / Late RMSE (m) |
|---|---:|---:|
| 普通中心法 / Global centroid | 0.480992 | 0.486746 |
| 最大色块法 / Largest component | 0.101467 | 0.003125 |

移动目标场景里两种方法效果相同；它们共享相机延迟，最大的色块也不能解决陈旧观测。

数据来自 [benchmarks.json](benchmarks.json) 的 10 组配置 / 20 条轨迹。已保存默认完整原始轨迹 [trace.csv](trace.csv)，其他场景可从浏览器导出或用模型生成。这些是确定性结果，不是随机重复的统计结论；相同数据重复计算不能增加证据强度。误差阈值、时间窗口和模型假设都影响结果。

## 本地复现

需要 Node.js 18+ 和 Python 3.9+，核心实验仅用标准库，无需安装 Python 包或 npm 依赖。在仓库根目录运行：

```sh
node test.cjs
node benchmark.cjs --check
python verify.py
```

17 项模型检查、完整基准核对以及 Python 独立几何/指标审计。修改模型后，运行 `node benchmark.cjs` 生成新基准；请在提交中说明参数和算法变动，保留失败场景。可选 `python -m http.server 8000 --directory docs` 后访问 `http://localhost:8000`。

可选重建预览图：安装 Pillow（`python -m pip install Pillow`），运行 `python build_preview.py`。动图取样自默认 CSV；字体及 Pillow 版本可能影响图像字节，核心数值不受影响。

## 实现和边界

- 相机：96 × 80 RGBA，已知正交标定，10 Hz；延迟作用在整帧观测，动作即时执行。像素中心到世界坐标的变换见 `pixel/world`。
- 感知：已知红/蓝/绿 RGB 原型，每通道差小于 35，至少 4 像素；四邻接连通域。策略输入只有像素与颜色指令。最大色块只是一个规则，较大的同色干扰物可能使它失败。
- 控制：固定正肘逆运动学，杆长 1 m 和 0.8 m；两个单位惯量独立关节，`q̈ = u − 0.3 q̇`，`u = clip(8(q_ref−q)−4q̇, −6, 6)`。未检测到目标时只制动。半隐式 Euler，dt = 0.01 s；速度上限 2 rad/s，关节范围 `[-π,π]`、`[0,π]`。
- 初态 `q=[−0.55,1.8]`、零速度。每次 12 s，末段指标使用 (8,12] s；接近阈值 0.06 m。相同场景和相同延迟下，两种方法使用完全相同的相机帧与控制器。
- 地面真实坐标仅用于合成画面、绘图和评分，不进入感知策略。目标缺失场景指红色物体不在相机画面中；误差仍相对已知的隐藏参考位置计算，不能作为检测成功的证据。
- 不含学习得到的 VLA、自由文本理解、真实摄像头、物理抓取、碰撞/接触、重力及连杆动力学耦合。它是 reaching 教学仿真。

RMSE 为等时间采样的欧氏位置误差均方根；末段误差使用上述末段窗口。近目标秒数是累计满足半径阈值的时间，不等于成功抓取或任务完成。观测可用率为实际使用的最近检测结果非空的控制步比例。

| File | Purpose / 用途 |
|---|---|
| `docs/index.html`, `app.js`, `style.css` | Bilingual browser UI / 双语交互 |
| `docs/engine.js` | Shared browser/Node model / 同一计算模型 |
| `test.cjs` | 17 meaningful model checks / 17 项模型检查 |
| `benchmark.cjs`, `benchmarks.json` | Reproducible paired study / 可复现对照 |
| `trace.csv`, `verify.py` | Raw default run + independent audit / 默认原始数据与独立审计 |
| `build_preview.py` | Optional GIF/cover regeneration / 可选重建动图及封面 |
| `ROADMAP.md` | Research extensions / 研究拓展 |


## 怎样发展成申请作品

先亲自复现，并独立解释一组成功和一组失败。再完成 [ROADMAP.md](ROADMAP.md) 中一个受控实验，展示你的修改、调参预算、独立评估场景和结论。论文式命名与星数不能替代你对代码和实验的理解。代码与初始文档由 AI 辅助生成；请在申请材料中说明你的实际贡献与验证工作。

## 参考、贡献与许可

[LeRobot](https://github.com/huggingface/lerobot) 提供真实机器人学习的数据、模型和工具，可作为后续 observation → policy → action 接口的参考。这里实现的是透明的颜色规则和关节伺服，没有接入或复现 LeRobot/VLA。机械臂几何和关节教学设定延续作者的 [robot-delay-lab](https://github.com/flessnerchernosky-ops/robot-delay-lab)，当前感知闭环单独实现。

欢迎按 [CONTRIBUTING.md](CONTRIBUTING.md) 改进教学案例、可访问性和实验分析。如果实验对你有帮助，欢迎 Star 或分享具体发现。MIT License，见 [LICENSE](LICENSE)。
