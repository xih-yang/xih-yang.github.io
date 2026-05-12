# 04、MyBatis - 拓展——Map的使用和模糊查询
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/4.html
- 分类：ORM框架
- 分组：教程目录
## 一、Map的使用

前面我们在Mapper接口的方法中，传入的参数都是一个基本类型或者是一个实体类，那么如果我们需要的参数不止一个但又用不到实体类所有的属性有没有什么更好的办法呢，这里我们就可以用到Map了。

我们还是以具体的操作来进行理解。

**1、** 利用Map实现查询；

1、修改UserMapper接口

```java
 1 package com.jms.dao;
 2 
 3 import java.util.List;
 4 import java.util.Map;
 5 
 6 import com.jms.pojo.User;
 7 
 8 public interface UserMapper {
 9     //利用Map获取User信息
10     User getUserbymap(Map<String, Object> map);
11 }
```

2、修改UserMapper.xml配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <select id="getUserbymap" parameterType="Map" resultType="com.jms.pojo.User">
      select * from user where id=#{mapid} and username=#{mapname}
  </select>
</mapper>
```

3、junit测试

```java
@Test
public void Select2() {
    //利用工具类获取SqlSession
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    Map<String, Object> map = new HashMap<String, Object>();
    map.put("mapid", 10000);
    map.put("mapname", "jms1");
    User user = userMapper.getUserbymap(map);
    System.out.println(user);
    sqlSession.close();
}
```

这里查询的是id为10000，username为jms1的用户信息。

测试结果：

**2、** 总结；

至今为止，我们已经有了三种进行参数传递的方式：

**1、** 传递一个基本类型；

**2、** 传递一个实体类；

**3、** 传递一个Map；

## 二、模糊查询

模糊查询有两种方法：

**1、** java代码中传递通配符“%%”；

1、修改UserMapper接口

```java
package com.jms.dao;
import java.util.List;
import java.util.Map;
import com.jms.pojo.User;
public interface UserMapper {
    //模糊查询获取User信息
    List<User> getUsersLike(String value);
}
```

2、修改UserMapper.xml配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <select id="getUsersLike" parameterType="String" resultType="com.jms.pojo.User">
      select * from user where username like{value}
  </select>
</mapper>
```

3、junit测试

```java
@Test
public void SelectLike() {
    //利用工具类获取SqlSession
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    List<User> users = userMapper.getUsersLike("%jms%");
    for(User user: users) {
        System.out.println(user);
    }
    sqlSession.close();
}
```

测试结果：

**2、** 在SQL语句中拼接通配符“%%”；

1、修改UserMapper接口

与上同。

2、修改UserMapper.xml配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.UserMapper">
  <!-- id对应接口中的方法 -->
  <select id="getUsers" resultType="com.jms.pojo.User">
  <select id="getUsersLike" parameterType="String" resultType="com.jms.pojo.User">
      select * from user where username like "%"#{value}"%"
  </select>
</mapper>
```

3、junit测试

```java
@Test
public void SelectLike() {
    //利用工具类获取SqlSession
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    List<User> users = userMapper.getUsersLike("jms");
    for(User user: users) {
        System.out.println(user);
    }
    sqlSession.close();
}
```

测试结果：

(本文仅作个人学习记录用，如有纰漏敬请指正)
