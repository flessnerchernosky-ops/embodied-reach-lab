# 从教学实验到独立研究 / From playground to independent study

当前版本已经完成浏览器对照、基准数据和模型检查。下列是尚未实现的研究任务。

The browser comparison, baseline data and model checks are implemented. The following studies are future work.

## 1

感知鲁棒性：加入不同大小的同色干扰物、光照偏移与像素噪声，明确随机种子。在固定调参预算下比较两种检测器，报告位置误差和误检/漏检率。

Perception robustness: vary same-color distractor size, illumination and pixel noise; record seeds. Compare both detectors under equal tuning budgets and report position error and false/missed detections.

## 2

延迟与记忆：为移动目标增加因果速度估计，比较“最近观测”与“观测预测”。禁止读取未来帧；调参和评估使用不同运动频率。

Latency and memory: implement a causal velocity estimator for moving targets. Compare latest observation against predicted observation without using future frames; hold out motion frequencies for evaluation.

## 3

学习策略：定义 RGB/关节 observation 与关节 action 接口，再迁移到合适的物理环境。先建立能复现的传统策略基线，再考虑示范数据、模仿学习及 LeRobot。

Learned policy: define RGB/joint observations and joint actions, then migrate to a suitable physics environment. Establish a reproducible classical baseline before demonstrations, imitation learning or LeRobot.

每次实验提交：问题、模型假设、参数/种子、调参和评估划分、成功及失败数据、代码改动、下一步。

Report the question, assumptions, settings/seeds, tuning/evaluation split, successes and failures, code changes and next step.
