# 04、Spring Data JPA 实战 - getOne和findOne的比较
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/4.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(A)
## getOne

- getOne是延迟加载。(返回的是一个动态代理对象，什么时候用，什么时候查询)
- getOne是JpaRepository中的方法
- getOne返回的是一个引用，即代理对象
- 当getOne查询不到结果时会抛出异常

```java
@Test
@Transactional(rollbackFor = Exception.class)
public void testGetOneAndSetOne(){
    Customer customer = this.customerRepository.getOne(1L);
    System.out.println(customer);
}
```

> getOne需要添加事务管理

看一下源码就可以发现，真正调用的是jpa中的em.getReference(getDomainClass(), id);

## findOne

- findOne是立即加载
- findOne是CrudRepository中的方法，
- findOne返回的是一个实体对象
- 当findOne查询不到结果时会返回null

```java
@Test
public void testGetOneAndSetOne(){
    Specification<Customer> specification=(root,query,cb)->{
        Path<Object> custId = root.get("custId");
        Predicate predicate = cb.equal(custId, 1L);
        return predicate;
    };
    Optional<Customer> customer = this.customerRepository.findOne(specification);
    System.out.println(customer.get());
}
```

## 比较

**现在两者都不进行输出(即两者产生的数据都不进行调用)，查看一下执行的sql语句情况**

getOne:不执行任何sql语句

findOne:执行sql语句

## 总结

**1、** getOne是延迟加载，而findOne是懒加载；

**2、** getOne是JpaRepository中的方法，而findOne是CrudRepository中的方法；

**3、** getOne返回的是一个引用，即代理对象，而findOne返回的是一个实体对象；

**4、** 当getOne查询不到结果时会抛出异常，当findOne查询不到结果时会返回null；
