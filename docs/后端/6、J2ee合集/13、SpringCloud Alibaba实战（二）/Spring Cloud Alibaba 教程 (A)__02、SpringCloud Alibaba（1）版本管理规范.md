# 02、SpringCloud Alibaba（1）版本管理规范
- 来源：https://ddkk.com/zhuanlan/j2ee/springcloudalibaba/2/35.html
- 分类：J2EE框架
- 分组：Spring Cloud Alibaba 教程 (A)
- 项目的版本号格式为 x.x.x 的形式，其中 x 的数值类型为数字，从 0 开始取值，且不限于 0~9 这个范围。项目处于孵化器阶段时，第一位版本号固定使用 0，即版本号为 0.x.x 的格式
- 由于 Spring Boot 1 和 Spring Boot 2 在 Actuator 模块的接口和注解有很大的变更，且 spring-cloud-commons 从 1.x.x 版本升级到 2.0.0 版本也有较大的变更，因此 SpringCloud Alibaba 采取跟 SpringBoot 版本号一致的版本:
- 1.5.x 版本适用于 Spring Boot 1.5.x
- 2.0.x 版本适用于 Spring Boot 2.0.x
- 2.1.x 版本适用于 Spring Boot 2.1.x
- 2.2.x 版本适用于 Spring Boot 2.2.x

**下表展示了 SpringCloud Alibaba & Spring Cloud & Spring Boot 兼容关系：**

Spring Cloud Version
SpringCloud Alibaba Version
Spring Boot Version

Spring Cloud Hoxton
2.2.x.RELEASE
2.2.x.RELEASE

Spring Cloud Greenwich
2.1.x.RELEASE
2.1.x.RELEASE

Spring Cloud Finchley
2.0.x.RELEASE
2.0.x.RELEASE

Spring Cloud Edgware
1.5.x.RELEASE
1.5.x.RELEASE

**本专栏项目选择的版本为：**

- Spring Boot 2.2.3.RELEASE
- Spring Cloud Hoxton.SR3
- SpringCloud Alibaba 2.2.0.RELEASE
