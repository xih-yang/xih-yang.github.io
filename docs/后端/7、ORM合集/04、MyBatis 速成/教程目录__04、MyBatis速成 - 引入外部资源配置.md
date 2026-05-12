# 04、MyBatis速成 - 引入外部资源配置
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/4.html
- 分类：ORM框架
- 分组：教程目录
本系列都使用maven构建，如果发现结构不一致，请变通创建相关文件和文件夹。

直接将数据库的配置写死在xml文件中对以后的实施维护产生较大的挑战，所以将这些配置文件放在外部资源文件中是较好的选择。mybatis通也提供了读取外部资源文件的方案

## 1.新建文件db.properties

置于resources下

> driver=com.mysql.jdbc.Driver
>
> url=jdbc:mysql://localhost:3306/td_xkd
>
> username=root
>
> password=1234

## 2.引入db.properties

主配置文件mybatis-config.xml添加如下配置

```xml
<!-- 引入外部资源文件
    resource:引入类路径下的资源文件
    url:引入磁盘或者网络路径下的资源文件
 -->
<properties resource="db.properties"></properties>
```

## 3.配置变量

将`driver`，`url`，`username`，`password`的值改为 `${driver}`，`${url}`，`${username}`，`${password}`，其他有关连接池的配置暂时不介绍。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <!-- 引入外部资源文件 -->
    <properties resource="db.properties"></properties>
    <!-- 配置驼峰命名规则 -->
    <settings>
        <setting name="mapUnderscoreToCamelCase" value="true"/>
    </settings>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC" />
            <dataSource type="POOLED">
                <property name="driver" value="${driver}" />
                <property name="url" value="${url}" />
                <property name="username" value="${username}" />
                <property name="password" value="${password}" />
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="settingsmapper.xml"/>
    </mappers>
</configuration>
```

测试是否可读取外部配置文件
