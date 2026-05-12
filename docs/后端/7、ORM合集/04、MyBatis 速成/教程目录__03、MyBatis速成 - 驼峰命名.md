# 03、MyBatis速成 - 驼峰命名
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/3.html
- 分类：ORM框架
- 分组：教程目录
本篇作为上一篇的补充，介绍上一篇可能出现的问题

## 1.mybatis详解-(2)问题分析

如果跟随上一篇的步骤测试，有的结果可能是正常的，但有的结果可能出现lastName=null的情况。lastName=null的情况，请注意sql中我为数据库表中的last_name字段起了个别名lastName，可以跟Employee对象对应，查询的结果就可以注入对象中。

```xml
<mapper namespace="org.mybatis.helloworld.EmployeeMapper">
    <select id="selectEmployee" resultType="org.mybatis.helloworld.Employee">
        select id,last_name lastName,email,gender from mybatis_employee where id ={id}
    </select>
</mapper>
```

## 2.驼峰命名配置

按照平时开发的正常规范，数据库表中的字段和对象的属性都是一一对应的，且一个属性多个单词，使用驼峰命名规则，数据库表中的字段使用下划线隔开每个单词。

mybatis提供了一个配置，可自动的将数据库字段解析为对象属性（去掉下划线，将下滑线的第一个字母大写，如：last_name可解析为lastName），需要在主配置文件中mybatis-config.xml添加如下配置：

```xml
<settings>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
</settings>
```

## 3.测试

修改mapper配置文件，将别名lastName去掉，测试数据库中的last_name值能否注入到对象lastName属性中。

```xml
<mapper namespace="org.mybatis.helloworld.EmployeeMapper">
    <select id="selectEmployee" resultType="org.mybatis.helloworld.Employee">
        select id,last_name,email,gender from mybatis_employee where id ={id}
    </select>
</mapper>
```

输出结果：

> DEBUG - Logging initialized using ‘class org.apache.ibatis.logging.slf4j.Slf4jImpl’ adapter.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> DEBUG - PooledDataSource forcefully closed/removed all connections.
>
> class com.sun.proxy.$Proxy2
>
> DEBUG - Openning JDBC Connection
>
> DEBUG - Created connection 665188480.
>
> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - ==> Preparing: select id,last_name,email,gender from mybatis_employee where id = ?
>
> DEBUG - ==> Parameters: 1(Integer)
>
> Employee [id=1, lastName=zhangsan, email=bestjinyi@163.com, gender=1]
>
> DEBUG - Resetting autocommit to true on JDBC Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - Closing JDBC Connection [com.mysql.jdbc.JDBC4Connection@27a5f880]
>
> DEBUG - Returned connection 665188480 to pool.
