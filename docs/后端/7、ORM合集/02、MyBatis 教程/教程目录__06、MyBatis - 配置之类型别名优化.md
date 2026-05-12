# 06、MyBatis - 配置之类型别名优化
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/6.html
- 分类：ORM框架
- 分组：教程目录
## 一、为什么要进行类型别名优化

首先我们来看一下前面写的UserMapper.xml配置文件：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <select id="getUsers" resultType="com.jms.pojo.User">
    select * from mybaties.user
  </select>
  <select id="getUserbyid" parameterType="int" resultType="com.jms.pojo.User">
      select * from mybaties.user where id=#{id}
  </select>
  <insert id="addUser" parameterType="com.jms.pojo.User">
      insert mybaties.user value(#{id},#{username},#{password})
  </insert>
  <update id="UpdateUser" parameterType="com.jms.pojo.User">
      update mybaties.user set username=#{username},password=#{password} where id=#{id}
  </update>
  <delete id="DeleteUser" parameterType="int">
      delete from mybaties.user where id=#{id}
  </delete>
</mapper>
```

其中"com.jms.pojo.User"是全限定类名，十分冗余，类型别名就是为了设置缩写名字，意在降低冗余的全限定类名书写。

## 二、怎样进行类型别名优化

**1、** 类型别名可为Java类型设置一个缩写名字；

我们修改mybatis-config.xml配置文件，为其添加以下的内容：

```java
 <typeAliases>
      <typeAlias type="com.jms.pojo.User" alias="User"/>
  </typeAliases>
```

需要注意一个点：mybatis-config.xml配置文件中各个标签都有着自己的固定顺序，这个顺序就是官方给出的配置结构顺序，打乱会报错。

接下来我们去把UserMapper.xml中全限定类名修改为我们的缩写名：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <select id="getUsers" resultType="User">
    select * from mybaties.user
  </select>
  <select id="getUserbyid" parameterType="_int" resultType="User">
      select * from mybaties.user where id=#{id}
  </select>
  <insert id="addUser" parameterType="User">
      insert mybaties.user value(#{id},#{username},#{password})
  </insert>
  <update id="UpdateUser" parameterType="User">
      update mybaties.user set username=#{username},password=#{password} where id=#{id}
  </update>
  <delete id="DeleteUser" parameterType="_int">
      delete from mybaties.user where id=#{id}
  </delete>
</mapper>
```

然后进行测试，测试通过。

**2、** 类型别名也可以指定一个包名；

我们还是先修改mybatis-config.xml配置文件：

```java
  <typeAliases>
      <package name="com.jms.pojo"/>
  </typeAliases>
```

指定包名后，MyBatis会自动搜索包下的JavaBean，此时又分为没有注解和有注解两种情况。

1、没有注解

会使用JavaBean的类名，首字母小写来作为它的别名，例如Hello.class，他的别名就是"hello"。接下来我们进行具体的试验。

先修改UserMapper.xml的内容：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <select id="getUsers" resultType="user">
    select * from mybaties.user
  </select>
  <select id="getUserbyid" parameterType="_int" resultType="user">
      select * from mybaties.user where id=#{id}
  </select>
  <insert id="addUser" parameterType="user">
      insert mybaties.user value(#{id},#{username},#{password})
  </insert>
  <update id="UpdateUser" parameterType="user">
      update mybaties.user set username=#{username},password=#{password} where id=#{id}
  </update>
  <delete id="DeleteUser" parameterType="_int">
      delete from mybaties.user where id=#{id}
  </delete>
</mapper>
```

测试通过。

经过实验，其实首字母不小写直接用类名也可以，但最好还是使用官方推荐的首字母小写的形式。

2、有注解

首先，为User类添加注解:

```java
package com.jms.pojo;
import org.apache.ibatis.type.Alias;
@Alias("hello")
public class User {
}
```

此时将其别名注解为"hello"，接下来修改UserMapper.xml配置文件中的名字：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <select id="getUsers" resultType="hello">
    select * from mybaties.user
  </select>
  <select id="getUserbyid" parameterType="_int" resultType="hello">
      select * from mybaties.user where id=#{id}
  </select>
  <insert id="addUser" parameterType="hello">
      insert mybaties.user value(#{id},#{username},#{password})
  </insert>
  <update id="UpdateUser" parameterType="hello">
      update mybaties.user set username=#{username},password=#{password} where id=#{id}
  </update>
  <delete id="DeleteUser" parameterType="_int">
      delete from mybaties.user where id=#{id}
  </delete>
</mapper>
```

进行测试，通过。

所以上面两种方式都可以进行类型别名优化，那么我们什么时候指定缩写名字，什么时候指定包名呢？

当包中的JavaBean较少时，指定定缩写名字；当包中的JavaBean较多时，指定包名。

## 三、java内建类型别名补充

下面是一些为常见的 Java 类型内建的类型别名。它们都是不区分大小写的，注意，为了应对原始类型的命名重复，采取了特殊的命名风格。

别名
映射的类型

_byte
byte

_long
long

_short
short

_int
int

_integer
int

_double
double

_float
float

_boolean
boolean

string
String

byte
Byte

long
Long

short
Short

int
Integer

integer
Integer

double
Double

float
Float

boolean
Boolean

date
Date

decimal
BigDecimal

bigdecimal
BigDecimal

object
Object

map
Map

hashmap
HashMap

list
List

arraylist
ArrayList

collection
Collection

iterator
Iterator

可以看到，基本类型是在前面加一个下分隔线，而其他类型是全部小写。
