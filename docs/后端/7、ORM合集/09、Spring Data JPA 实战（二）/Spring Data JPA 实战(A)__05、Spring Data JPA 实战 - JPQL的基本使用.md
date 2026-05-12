# 05、Spring Data JPA 实战 - JPQL的基本使用
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/5.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(A)
## 基本概述

jpql的查询方式

jpql ： jpa query language （jpq查询语言）

特点：

1. 语法或关键字和sql语句类似
2. 查询的是类和类中的属性
3. 需要将JPQL语句配置到接口方法上

1）.特有的查询：需要在dao接口上配置方法

2）.在新添加的方法上，使用注解的形式配置jpql查询语句

3）.注解 ： @Query

## 查询

### 单参数查询

```java
//    @Query(value="select * from cst_customer where cust_name=?1",nativeQuery = true)
//    @Query(value="from Customer  where cust_name= ?1")
//    @Query(value="select c from Customer  c where c.custName=?1")
//    @Query(value="from Customer c where c.custName=:#{#custName}")
@Query(value="from Customer c where c.custName=:custName")
List<Customer> findAllCustomerByName(@Param("custName") String custName);
```

这几种方式是等价的

- @Query(value=“select * from cst_customer where cust_name=?1”,nativeQuery = true)
- @Query(value=“from Customer where cust_name= ?1”)
- @Query(value=“select c from Customer c where c.custName=?1”)
- @Query(value=“from Customer c where c.custName=:#{#custName}”)
- @Query(value=“from Customer c where c.custName=:custName”)

### 多参数查询

```java
//    @Query(value="from Customer  c where c.custId=?2 and c.custName=?1")
//    @Query(value="from Customer  c where c.custId=:#{#custId} and c.custName=:#{#custName}")
@Query(value="from Customer  c where c.custId=:custId and c.custName=:custName")
List<Customer> findCustomersByNameAndIndus(@Param("custName") String name,@Param("custId") Long id);
```

这几种方式是等价的(还有一种原生sql的方式)

- @Query(value=“from Customer c where c.custId=?2 and c.custName=?1”)
- @Query(value=“from Customer c where c.custId=:#{#custId} and c.custName=:#{#custName}”)
- @Query(value=“from Customer c where c.custId=:custId and c.custName=:custName”)

### 参数为对象查询

```java
@Query(value="from Customer  c where c.custId=:#{#customer.custId}")
Customer findCustomerByInfo(@Param("customer") Customer customer);
```

## 更新和删除

> 注意

1.使用 delete 或者 update 操作时

@query注解下方需要增加 @Modifying注解

2.在测试dao层(update、delete)方法时，必须开启事务@Transactional注解

3.在测试dao层(update、delete)方法时，默认不开启事务提交，

需要配置@Rollback(value = false)

### update

```java
@Query(value="update Customer c set c.custName=:custName where c.custId=:custId")
@Modifying
Integer updateCustomer(@Param("custId")Long custId,@Param("custName") String custName);
```

测试

```java
@Test
@Transactional(rollbackFor = Exception.class)
@Rollback(value=false)  //设置是否自动回滚
public void testJpqlUpdate() {
    Integer flag = this.customerRepository.updateCustomer(2L, "黑马飞起来");
    System.out.println(flag==1?"更新成功":"更新失败");
}
```

### delete

```java
@Query(value="delete Customer  c where c.custId=:custId")
@Modifying
Integer deleteCustomer(@Param("custId")Long custId);
```

测试

```java
@Test
@Transactional(rollbackFor = Exception.class)
@Rollback(value=false)  //设置是否自动回滚
public void testJpqlUpdate() {
    Integer flag = this.customerRepository.deleteCustomer(3L);
    System.out.println(flag==1?"删除成功":"删除失败");
}
```
