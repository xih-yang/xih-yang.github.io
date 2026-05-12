# 16、JDBC 教程 - JdbcTemplate(上)
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/16.html
- 分类：缓存数据库
- 分组：教程目录
## Spring JDBC

**Spring框架**对JDBC的简单封装，提供了一个**JdbcTemplate**对象简化JDBC的开发

## 步骤

**1、** 导入jar包；

**2、** 创建**JdbcTemplate**对象，依赖于数据源**DataSource**；

`JdbcTemplate template = new JdbcTemplate(ds);`

所以说**JDBCTemplate**跟前面学过的**数据库连接池**紧密关联
**3、** 调用**JDBCTemplate**的方法来完成**CRUD**的操作；

`update()`：执行DML语句，即增、删、改语句

`queryForMap()`：查询结果将结果集封装为map集合

`queryForList()`：查询结果将结果集封装为list集合

`query()`：查询结果，将结果封装为JavaBean对象

`queryForObject()`：查询结果，将结果封装为对象

## 演示

```java
package com.zzq.jdbctemplate;
import com.zzq.Druid.util.JDBCUtils;
import org.springframework.jdbc.core.JdbcTemplate;
/**
 * JdbcTemplate入门
 */
public class JdbcTemplateDemo01 {
    public static void main(String[] args) {
        //1.导入jar包
        //2.创建JDBCTemplate对象
        JdbcTemplate template = new JdbcTemplate(JDBCUtils.getDataSource());
        //3.调用方法
        String sql = "update account set balance = 5000 where id = ?";
        int count = template.update(sql, 3);
        System.out.println(count);
    }
}
```

运行效果：
