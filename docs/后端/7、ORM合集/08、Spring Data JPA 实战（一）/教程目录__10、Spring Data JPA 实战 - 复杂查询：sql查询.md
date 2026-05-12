# 10、Spring Data JPA 实战 - 复杂查询：sql查询
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/10.html
- 分类：ORM框架
- 分组：教程目录
## 0. 规则

```java
1.特有的查询：需要在dao接口上配置方法
2.在新添加的方法上，使用注解的形式配置sql查询语句
3.注解 ： @Query
		value ：jpql语句 | sql语句
		nativeQuery ：false（使用jpql查询） | true（使用本地查询：sql查询）
			是否使用本地查询
```

## 1. 查询全部

在SpringDataJPA（9）中，1中的dao中添加如下方法（在这里我便不将所有的代码复制了）

```java
/**
 * 使用sql查询全部
 *      sql：select * from cst_customer
 * Query :配置sq1查询
 *      value : sql语句
 *      nativeQuery :查询方式
 *          true :   sq1查询
 *          false: jpq1查询
 *
 * @return
 */
@Query(value = "select * from cst_customer",nativeQuery = true)
public List<Object []> findSql();
```

在SpringDataJPA（9）中，1中的测试类中添加如下方法（在这里我便不讲所有的代码复制了）

```java
@Test
public void testFindSql(){
    List<Object[]> list = customerDao.findSql();
    for (Object[] objects:list){
        System.out.println(Arrays.toString(objects));
    }
}
```

运行结果：

## 2. 条件查询

在SpringDataJPA（9）中，1中的dao中添加如下方法（在这里我便不将所有的代码复制了）

```java
@Query(value = "select * from cst_customer where cust_name like ?",nativeQuery = true)
    public List<Object []> findCondition(String name);
```

在SpringDataJPA（9）中，1中的测试类中添加如下方法（在这里我便不讲所有的代码复制了）

```java
@Test
public void testFindCondition(){
    List<Object[]> list = customerDao.findCondition("延迟");
    for (Object[] objects:list){
        System.out.println(Arrays.toString(objects));
    }
}
```

运行结果：
