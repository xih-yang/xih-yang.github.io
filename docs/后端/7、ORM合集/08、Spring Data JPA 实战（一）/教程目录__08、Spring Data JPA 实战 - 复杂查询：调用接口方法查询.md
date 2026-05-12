# 08、Spring Data JPA 实战 - 复杂查询：调用接口方法查询
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/5/8.html
- 分类：ORM框架
- 分组：教程目录
## 1. 查询全部count

这个方法是在SpringDataJPA（6）里面的3.1中的测试方法里面，为了简单起见，就不再将那些重复代码进行复制

```java
/**
 * 统计查询：查询客户的总数量
 */
@Test
public void testCount(){
    long count = customerDao.count();
    System.out.println(count);
}
```

运行结果

## 2. 是否存在exists

这个方法是在SpringDataJPA（6）里面的3.1中的测试方法里面，为了简单起见，就不再将那些重复代码进行复制

```java
/**
     * 判断id为4的客户是否存在
     *      第一种方法：
     *          可以查询以下id为4的客户
     *          如果值为空，代表不存在，如果不为空，代表存在
     *      第二种方法：
     *          判断数据库中id为4的客户的数量
     *          如果数量为0，代表不存在，如果大于9，代表存在
     *      第三种方法：
     *          使用接口exists方法
     */
    @Test
    public void testExists(){
        boolean e = customerDao.exists(4l);
        System.out.println(e);
    }
```

运行结果

## 3. 根据id查询getOne()

这个方法是在SpringDataJPA（6）里面的3.1中的测试方法里面，为了简单起见，就不再将那些重复代码进行复制

```java
/**
     * 根据id从数据库查询
     *      @Transactional :保证getOne正常运行
     * findOne:
     *      em. find()          :立即加载
     * getOne:
     *      em. getReference    :延迟加载
     * 			返回的是一个客户的动态代理对象
				什么时候用，什么时候查询
     */
    @Test
    @Transactional
    public void testGetOne(){
        Customer one = customerDao.getOne(4l);
        System.out.println(one);
    }
```

运行结果
