# 11、MyBatis - 分页——利用SQL的limit实现
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/11.html
- 分类：ORM框架
- 分组：教程目录
## 一、SQL中limit的基本用法

我们先来熟悉SQL中limit的基本用法

这是我现有的表结构

然后进行limit查询

**1、** ；

```java
select * from user limit 3,4
```

这句SQL语句的意思是查询user表，跳过前3行，也就是从第四行开始查询4行数据。查询结果如下：

**2、** ；

```java
select * from user limit 3
```

这句SQL语句的意思是查询user表，跳过前0行，查询3行数据。也是就相当于下面这句：

```java
select * from user limit 0,3
```

查询结果如下：

现在我们知道了limit的基本用法，我们就尝试在MyBatis中实现。

## 二、在MyBatis中实现limit分页

首先我们要知道实现limit分页需要什么，很明显需要两个参数，一个表示跳过多少行，一个表示查询多少行。

1、在UserMapper接口中建立方法

```java
//利用limit进行分页
List<User> getUserbyLimit(Map<String, Integer> map);
```

2、在UserMapper.xml中实现接口

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
    <resultMap id="UserMap" type="User">
        <!--column对应数据库表的列名,property对应实体类属性-->
        <result column="password" property="pwd"/>
    </resultMap>
    <!-- id对应接口中的方法-->
    <select id="getUserbyid" parameterType="_int" resultMap="UserMap">
        select * from mybaties.user where id=#{id}
    </select>
    <select id="getUserbyLimit" parameterType="map" resultMap="UserMap">
        select * from mybaties.user limit{SkipPage},#{CapturePage}
    </select>
</mapper>
```

3、建立junit测试

```java
@Test
    public void limittest() {
        //利用工具类获取SqlSession
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        //利用SqlSession获取UserMapper接口
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
        Map<String, Integer> map = new HashMap<>();
        map.put("SkipPage", 5);
        map.put("CapturePage", 10);
        //调用方法
        List<User> userList = userMapper.getUserbyLimit(map);
        for (User user : userList) {
            System.out.println(user);
        }
　　　　　sqlSession.close();
    }
```

测试结果如下：
