# 12、MyBatis - RowBounds实现分页
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/12.html
- 分类：ORM框架
- 分组：教程目录
首先说明一下，这种涉及了在MyBatis（二）中说的那个第二种老方法，所以一般不推荐使用。

上一篇我们利用SQL的limit实现了分页，是在SQL层面的，那么这次我们利用java代码RowBounds来实现。直接上操作。

## 一、RowBounds实现分页

**1、** 在UserMapper接口中声明一个新的方法；

```java
//利用RowBounds进行分页
List<User> getUserbyRowBounds();
```

**2、** 在UserMapper.xml中实现这个方法；

```xml
<select id="getUserbyRowBounds" resultMap="UserMap">
    select * from mybaties.user
</select>
```

**3、** junit测试；

```java
@Test
public void RowBoundstest() {
    //利用工具类获取SqlSession
     SqlSession sqlSession = MyBatisUtil.getSqlSession();
     RowBounds rowBounds = new RowBounds(5, 10);
     List<User> userList = sqlSession.selectList("com.jms.dao.UserMapper.getUserbyRowBounds",
             null, rowBounds);
    for (User user : userList) {
        System.out.println(user);
    }
　　　　　sqlSession.close();
}
```

测试结果：

## 二、MyBatis分页插件pageHelper

官方地址：[https://pagehelper.github.io/](https://pagehelper.github.io/)

## 三、自己实现一个分页的类

**1、** 建立一个工具类PaginationUtil.class；

```java
package com.jms.utils;
import java.util.List;
public class PaginationUtil {
    public static <T> List<T> Pagination(List<T> list, int offset , int limit) {
        while (offset > 0) {
            list.remove(0);
            offset --;
        }
        while (list.size() > limit) {
            list.remove(limit);
        }
        return list;
    }
}
```

**2、** junit测试；

```java
@Test
public void test2() {
    SqlSession sqlSession = MyBatisUtil.getSqlSession();
    UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
    List<User> userList = userMapper.getUserbyRowBounds();
    PaginationUtil.Pagination(userList, 5, 10);
    for (User user : userList) {
        System.out.println(user);
    }
　　　　　sqlSession.close();
}
```

测试结果：
