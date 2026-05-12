# 01、Nginx 精通 - 产品族概览
- 来源：https://ddkk.com/zhuanlan/server/nginx/4/1.html
- 分类：服务器框架
- 分组：教程目录
Nginx是当今使用最广泛的 Web 服务器之一。2021年W3Techs 宣布， Nginx市场份额超越 Apache HTTP Server 成为全球最常用的 Web 服务器，最新Web Server排名如图所示（实际超过4亿站点实用Nginx）。

Nginx由Igor Sysoev在2001年创建，其初衷是解决 C10K 问题：即客户端同时处理10,000 个连接的问题。Nginx采用了轻量级、可扩展且功能强大的事件驱动型架构，易于新增动态模块；经过多年发展，nginx增加了许多实用且强大的功能，包括反向代理、负载均衡、流量整形、高速缓存和安全控制等。

## Nginx产品系列

目前，Nginx产品系列分为如下一些产品：

### Nginx开源版

Nginx是开源版本，免费使用。

### Nginx Plus

Nginx Plus是Nginx的加强版，是在开源Nginx功能基础上，提供了许多适合生产环境的专有功能，包括高可用性、主动健康检查、DNS 系统发现、会话保持和 RESTful API等，很多功能都需要收费。

### NGINX 企阅版

以NGINX 开源版作为底座，在其所具有的开源、稳定、轻量、灵活、高性能特征基础之上，为用户提供企业级的技术支持服务、专业顾问服务、定制开发服务、认证培训服务，如图：

### NGINX App Protect

NGINX App Protect 是一款轻量级的软件安全防护解决方案，能够作为强大的 Web 应用防火墙（WAF）和七层拒绝服务（DoS）防御，可无缝集成。它与平台无关，可以横跨分布式架构并在混合环境中运行，且提供一致的应用防护能力。

### NGINX Management Suite

借助 API 驱动的自助工具套件加速应用和 API 的部署过程。无论您的应用是部署在云端、本地还是边缘，NGINX Management Suite 都可以帮您简化生命周期管理和安全防护。产品主要包括四大部分：实例管理、应用发布管理、API连接管理和安全防护。

### NGINX Ingress Controller

NGINX Ingress Controller 部署在 Kubernetes 集群入口的中心，它降低了复杂性，增加了正常运行时间，并且可以大规模地帮助您更好地了解应用运行状况和性能。

### NGINX Service Mesh

NGINX Service Mesh为 Kubernetes 服务提供企业级的可用性、安全防护以及可视化。在 Kubernetes 集群中减少复杂性，延长正常运行时间，并大规模且更好地获取关于 service 健康状况和性能状况的洞察信息。

### NGINX Unit

NGINX Unit是一个通用的 Web 应用服务器，它将典型应用堆栈中的数层架构集合成为了一个组件。功能如下：

- 作为 Web 服务器提供静态媒体文件服务
- 运行多语言的原生应用代码
- 执行反向代理到后端服务器

#### NGINX Unit 与 NGINX Web 服务器相比如何？

**先进的架构**

- NGINX Unit 是由最初的 NGINX 团队在全新的开源代码库上创造的。
- 该架构融合了运行全世界最受欢迎的 Web服务器的十余年经验。
- 与 NGINX Web 服务器不同，NGINX Unit 采用了多进程且多线程的架构。

**运行应用代码**
- NGINX Web 服务器通常作为反向代理被部署到Web 应用前端。NGINX 可以原生地运行应用代码，并将完整的应用配置放在单一位置。
- NGINX Unit 可以运行使用 Java、PHP、Python 或 Ruby 编写的 Web 应用和 API，且无需在中间放置任何进程管理器或应用服务器。
- NGINX Unit 可以为 Web 应用的静态资产和动态内容提供服务。

**全动态配置体验**
- NGINX Unit 完全使用 JSON 配置，因此无需学习新的配置语法。
- 变更可被立即应用，无需重新加载，也不会中断正在进行的请求。
- 可以通过“配置 API”修改单个值或者替换整个配置。

### NGINX Amplify

NGINX Amplify 是一个免费的、基于 SaaS 的监控工具，适用于 NGINX 开源版和 NGINX Plus。它不仅能监控系统性能、跟踪硬件设施，还能通过静态分析进行配置优化。不仅如此，NGINX Amplify 还能够监控底层操作系统、应用服务器（如 PHP FPM）、数据库和其他组件。NGINX Amplify 的设置虽然简单，但是它的功能之强大足以提供针对 NGINX 和系统性能的专业分析洞察。

### 产品收费情况

Nginx开源版：免费

Nginx Plus：收费

NGINX 企阅版：收费

NGINX App Protect：收费

NGINX Management Suite：收费

NGINX Ingress Controller：收费

NGINX Service Mesh：免费

NGINX Unit：免费

NGINX Amplify ：免费注册，需要把你的服务器相关信息注册到Nginx Amplify

当前Nginx已经比较商业化了，一般应用如只需web服务、反向代理、负载均衡等基础功能，用Nginx开源版就可以满足。至于商业版本，是真实需要而定。
