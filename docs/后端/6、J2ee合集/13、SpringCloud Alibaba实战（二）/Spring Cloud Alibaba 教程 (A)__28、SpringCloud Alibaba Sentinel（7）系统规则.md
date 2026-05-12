# 28、SpringCloud Alibaba Sentinel（7）系统规则
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/61.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
系统规则则是针对整个系统设置限流规则，并不针对某个资源，设置页面如下：

**阈值类型包含以下五种：**

- Load 自适应（仅对 Linux/Unix-like 机器生效）：系统的 load1 作为启发指标，进行自适应系统保护。当系统 load1 超过设定的启发值，且系统当前的并发线程数超过估算的系统容量时才会触发系统保护（BBR 阶段）。系统容量由系统的 maxQps minRt 估算得出。设定参考值一般是 CPU cores 2.5。
- CPU usage（1.5.0+ 版本）：当系统 CPU 使用率超过阈值即触发系统保护（取值范围 0.0-1.0），比较灵敏。
- 平均 RT：当单台机器上所有入口流量的平均 RT 达到阈值即触发系统保护，单位是毫秒
- 并发线程数：当单台机器上所有入口流量的并发线程数达到阈值即触发系统保护
- 入口 QPS：当单台机器上所有入口流量的 QPS 达到阈值即触发系统保护
