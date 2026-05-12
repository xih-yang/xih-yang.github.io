# 18、MyBatis - MyBatis中column属性的总结
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/18.html
- 分类：ORM框架
- 分组：教程目录
在MyBatis的映射中有column这么一个属性，我一直以为它映射的是数据库表中的列名，但经过学习发现他似乎映射的是SQL语句中的列名，或者说是查询结果所得到的表的列名。

下面我们进行一个实验。

首先我们有一张user表：

****

我还有一个实体类User，有着id、username、password三个属性。

我们的UserMapper接口中有着获取这张表单所有数据的方法。

我们现在在UserMapper.mxl中这样写：

```xml
<select id="getUsers" resultType="User">
    select * from mybaties.user
</select>
```

或者这样写：

```xml
<select id="getUsers" resultType="User">
    select id, username, password from mybaties.user
</select>
```

这两句完全相同，我们去测试一下看看结果：

成功获取了所有信息。

现在给password起个别名pwd，在UserMapper.mxl中这样写：

```xml
<select id="getUsers" resultType="User">
    select id, username, password as pwd from mybaties.user
</select>
```

此时我们再去运行：

我们会发现password竟然变成了null。

此时我们去配置一个结果映射，让pwd映射到我们的属性password：

```xml
<resultMap id="um" type="User">
    <result property="password" column="pwd"/>
</resultMap>
<select id="getUsers" resultMap="um">
    select id, username, password as pwd from mybaties.user
</select>
```

测试结果：

没有问题。

得出结论：映射到属性的字段名是查询结果的列名，而不是数据库中已存在的表的列名。
