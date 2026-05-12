# 02、Mybatis-Plus入门 - 分页插件PaginationInnerInterceptor
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/2.html
- 分类：ORM框架
- 分组：教程目录
### 前言

MybatisPlus版本：3.4.2

Plus源码中，分页插件相关代码位于mybatis-plus-extension包下。

**分页方言**：众所周知，每个数据库都有自己的方言，比如MySQL 的分页是用关键字 limit， 而 Oracle 用的是 ROWNUM，dialects包下对匹配了众多数据的分页方言，比如 DB2、MySql、Oracle、SQLServer等。

**分页模型**：采用Page作为统一的简单分页模型，封装了查询数据列表、总数、每页显示条数（默认 10）、当前页、排序字段信息等内容。

### 直接使用

#### 默认分页查询

**1、** 参照入门文档搭建项目，配置分页插件；

```java
@Configuration
@EntityScan("org.seata.service.order.entity")
@MapperScan(basePackages = "org.seata.service.order.**.dao", markerInterface = BaseMapper.class)
public class MyBatisPlusConfig {
    /**
     *  插件集合
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        //  插件
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件
        PaginationInnerInterceptor paginationInnerInterceptor = new PaginationInnerInterceptor(DbType.MARIADB);
        // 添加分页插件
        interceptor.addInnerInterceptor(paginationInnerInterceptor);
        return interceptor;
    }
}
```

**1、** 编写测试接口，查询某表数据，实现在表中插入了1W+测试数据；

```java
    @GetMapping("testPage")
    public Object testPage() {
    	//  分页查询对象，未添加任何分页参数
        Page<OrderTbl> page=new Page();
        Page<OrderTbl> orderTblPage = orderTblService.page(page);
        System.err.println("查询结果列表大小:"+orderTblPage.getRecords().size());
        System.err.println("总条数:"+orderTblPage.getTotal());
        System.err.println("countId:"+orderTblPage.getCountId());
        System.err.println("当前页:"+orderTblPage.getCurrent());
        System.err.println("每页显示条数，默认 10:"+orderTblPage.getSize());
        System.err.println("最大分页条数限制:"+orderTblPage.getMaxLimit());
        System.err.println("总页数:"+orderTblPage.getPages());
        return orderTblPage;
    }
```

**1、** 调用测试接口，可知plus查询分页对象当前页的默认值为1，分页条数为10，countId未设置，最大分页数量默认无限制；

#### 自定义分页对象查询

**1、** 配置当前页及每页条数（也可通过构造方法配置）；

```java
        Page<OrderTbl> page=new Page<>();
        // 设置分页查询参数
        page.setCurrent(1);
        page.setSize(10000L);
```

**1、** 自定义count查询语句；

Mapper：

```java
public interface OrderTblMapper extends BaseMapper<OrderTbl> {
    //  自定义count
    Long myCount();
}
```

XML：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.seata.service.order.dao.OrderTblMapper">
    <select id="myCount" resultType="java.lang.Long">
           select  count(id) from order_tbl
    </select>
</mapper>
```

配置countId

```java
        // 设置分页查询参数
        page.setSize(10000L);
        page.setCurrent(1);
        // countId可写mapper接口方法，也可以带全路径包名
        page.setCountId("myCount");
```

测试发现，已经使用了自定义的方法进行count查询。

**1、** 分页限制，防止溢出；

```java
        page.setMaxLimit(100L);
```

测试发现：虽然配置每页条数为1W，但是因为设置了MaxLimit，只返回了100条数据。

**1、** 关闭count,默认true（打开）；

```java
page.setSearchCount(false);
```

测试：没有打印count查询语句，总条数为0

**1、** 是否优化COUNTSQL，默认值为true；

不优化时count Sql打印如下，会对查询语句的结果集再进行count处理，效率不高

### 分页插件配置

PaginationInnerInterceptor作为plus的分页插件，提供了通用的参数进行统一配置。

```java
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        //  插件
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件
        PaginationInnerInterceptor paginationInnerInterceptor = new PaginationInnerInterceptor();
        // 设置最大分页数
        paginationInnerInterceptor.setMaxLimit(100L);
        // 是否对超过最大分页时做溢出处理
        paginationInnerInterceptor.setOverflow(true);
        // 设置数据库类型
        paginationInnerInterceptor.setDbType(DbType.MARIADB);
        //paginationInnerInterceptor.setProperties();
       // paginationInnerInterceptor.setDialect();
        //paginationInnerInterceptor.setOptimizeJoin();
        // 添加分页插件
        interceptor.addInnerInterceptor(paginationInnerInterceptor);
        return interceptor;
    }
```

**1、** setMaxLimit：设置最大分页数；

**2、** setOverflow：是否对超过最大分页时做溢出处理，默认false不处理，即直接丢弃溢出的数据，为true时，怎么把溢出数据放入到下一个分页中；

**3、** setDbType：设置数据库类型以匹配不同方言；

**4、** setDialect：设置分页方言；

**5、** setOptimizeJoin：优化Join分页语句，默认true；
