# 4.1 概述
- 来源：https://ddkk.com/zhuanlan/orm/jfinal/33.html
- 分类：ORM框架
- 分组：4 AOP
传统AOP实现需要引入大量繁杂而多余的概念，例如：Aspect、Advice、Joinpoint、Poincut、Introduction、Weaving、Around等等，并且需要引入IOC容器并配合大量的XML或者annotation来进行组件装配。

传统AOP不但学习成本极高，开发效率极低，开发体验极差，而且还影响系统性能，尤其是在开发阶段造成项目启动缓慢，极大影响开发效率。

JFinal采用极速化的AOP设计，专注AOP最核心的目标，将概念减少到极致，仅有三个概念：Interceptor、Before、Clear，并且无需引入IOC也无需使用啰嗦的XML。

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> JFinal 官方 | https://jfinal.com
