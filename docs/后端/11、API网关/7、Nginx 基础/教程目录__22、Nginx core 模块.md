# 22、Nginx core 模块
- 来源：https://ddkk.com/zhuanlan/server/nginx/1/22.html
- 分类：服务器框架
- 分组：教程目录
## core 模块

## Nginx 的启动模块

启动模块从启动 Nginx 进程开始，做了一系列的初始化工作，源代码位于src/core/nginx.c，从 main 函数开始:

- 时间、正则、错误日志、ssl 等初始化
- 读入命令行参数
- OS 相关初始化
- 读入并解析配置
- 核心模块初始化
- 创建各种暂时文件和目录
- 创建共享内存
- 打开 listen 的端口
- 所有模块初始化
- 启动 worker 进程
