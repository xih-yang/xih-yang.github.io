# 04、Spring Data JPA 实战 - 查询删除更新操作
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/4.html
- 分类：ORM框架
- 分组：教程目录
本篇文件是SpringDataJPA（2）的延续，需要将该博客（SpringDataJPA（2））内容看懂才可以

## 1.通过id查询

使用find方法查询

1.查询的对象就是当前客户对象本身

2.在调用find方法的时候，就会发送sql语句查询数据南

**使用getReference查询**

1.获取的对象是一个动态代理对象

2.调用getReference方法不会立即发送sql语句查询数据库：延迟加载（懒加载）

当调用查询结果对象的时候，才会发送查询的sql语句，什么时候用，什么时候发送sql语句查询数据库

我们习惯性将通过find方法进行查询叫做立即加载，通过reference加载叫做延迟加载（懒加载），我们一般使用的是延迟加载的方式进行加载，因为是为了避免写了一段代码就要去查询数据库，但是最后并没有用，提高效率

**延迟加载，懒加载**

得到的是-一个动态代理对象

什么时候用，什么使用才会查询

### 1.1通过find方法查询

```java
/**
 * 根据id查询客户
 */
@Test
public void testFind(){
    //1.通过工具类获取entityManager
    EntityManager entityManager = JpaUtils.getEntityManager();
    //2.开启事务
    EntityTransaction tx = entityManager.getTransaction();
    tx.begin();
    //3.增删改查:根据id查询客户
    /*
    find：根据id查询数据
        class：查询数据的结果需要包装的实体类类型的字节码
        id：查询的主键的取值
     */
    Customer customer = entityManager.find(Customer.class, 1l);//在该处会查询数据库，即将数据库对应id的内容进行了获取
    System.out.println(customer);
    //4.提交事务
    tx.commit();
    //5.释放资源
    entityManager.close();
}
```

运行结果

### 1.2通过getReference查询

```java
@Test
public void testReference(){
    //1.通过工具类获取entityManager
    EntityManager entityManager = JpaUtils.getEntityManager();
    //2.开启事务
    EntityTransaction tx = entityManager.getTransaction();
    tx.begin();
    //3.增删改查:根据id查询客户
    /*
    find：根据id查询数据
        class：查询数据的结果需要包装的实体类类型的字节码
        id：查询的主键的取值
     */
    Customer customer = entityManager.getReference(Customer.class, 1l);//在这个地方并不会去查询数据库，获取到的是乱码数据
    System.out.println(customer);//在该处才会去查询数据库，获取到完整的数据
    //4.提交事务
    tx.commit();
    //5.释放资源
    entityManager.close();
}
```

## 2.删除

```java
@Test
public void testRemove(){
    //1.通过工具类获取entityManager
    EntityManager entityManager = JpaUtils.getEntityManager();
    //2.开启事务
    EntityTransaction tx = entityManager.getTransaction();
    tx.begin();
    //3.增删改查:删除客户
    //（1）根据id查询客户
    Customer customer = entityManager.find(Customer.class, 1l);
    //（2）调用remove方法完成删除操作
    entityManager.remove(customer);
    //4.提交事务
    tx.commit();
    //5.释放资源
    entityManager.close();
}
```

运行结果

## 3.更新

```java
@Test
public void testUpdate(){
    //1.通过工具类获取entityManager
    EntityManager entityManager = JpaUtils.getEntityManager();
    //2.开启事务
    EntityTransaction tx = entityManager.getTransaction();
    tx.begin();
    //3.增删改查:更新客户
    //（1）根据id查询客户
    Customer customer = entityManager.find(Customer.class, 2l);
    //（2）更新客户
    customer.setCustIndustry("工厂");
    entityManager.merge(customer);
    //4.提交事务
    tx.commit();
    //5.释放资源
    entityManager.close();
}
```

运行结果：
