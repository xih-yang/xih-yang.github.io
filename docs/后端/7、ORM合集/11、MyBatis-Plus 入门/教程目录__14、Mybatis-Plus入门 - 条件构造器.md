# 14、Mybatis-Plus入门 - 条件构造器
- 来源：https://ddkk.com/zhuanlan/orm/mybatisplus/5/14.html
- 分类：ORM框架
- 分组：教程目录
## 前言

mybatis-plus提供了强大的条件构造器，用于构造Where条件。

```java
Wrapper  条件构造抽象类
    -- AbstractWrapper 查询条件封装，用于生成 sql 中的 where 语句。
        -- QueryWrapper Query封装操作类，用于查询。
        -- UpdateWrapper Update条件封装操作类，用于更新。
        -- AbstractLambdaWrapper 使用 Lambda 表达式封装 wrapper
            -- LambdaQueryWrapper 使用 Lambda 语法封装条件，用于查询。
            -- LambdaUpdateWrapper 使用 Lambda 语法封装条件，用于更新。
```

## AbstractWrapper

QueryWrapper(LambdaQueryWrapper) 和 UpdateWrapper(LambdaUpdateWrapper) 的父类用于生成 sql 的 where 条件, entity 属性也用于生成 sql 的 where 条件。

### 案例演示

以下案例全部采用Lambda表达式，这样

#### allEq

全部eq(或个别isNull)。

```java
allEq(Map<R, V> params)
allEq(Map<R, V> params, boolean null2IsNull)
allEq(boolean condition, Map<R, V> params, boolean null2IsNull)
```

**参数说明**：

```java
params : key为数据库字段名,value为字段值
null2IsNull : 为true则在map的value为null时调用 isNull 方法,为false时则忽略value为null的
condition: 该条件是否加入最后生成的sql中
```

**案例演示**：

```java
    @Test
    public void allEqTest() {
        System.out.println("----- allEq ------");
        LambdaQueryWrapper<OrderTbl> queryWrapper = Wrappers.lambdaQuery();
        Map<SFunction<OrderTbl, ?>,Object> params = new HashMap<>();
        params.put(OrderTbl::getUserId, 123);
        params.put(OrderTbl::getCount, 0);
        // allEq(Map<R, V> params)
        // queryWrapper.allEq(params);
        // SELECT id,user_id,commodity_code,count,money,dept_id,tenant_id,is_deleted,version,oper_user,gmt_create,gmt_modified FROM order_tbl WHERE is_deleted=0 AND (count = 0 AND user_id = 123)
        params.put(OrderTbl::getCommodityCode, null);
        // allEq(Map<R, V> params, boolean null2IsNull)
        // queryWrapper.allEq(params,true);
        // SELECT id,user_id,commodity_code,count,money,dept_id,tenant_id,is_deleted,version,oper_user,gmt_create,gmt_modified FROM order_tbl WHERE is_deleted=0 AND (count = 0 AND user_id = 123 AND commodity_code IS NULL)
        // allEq(boolean condition, Map<R, V> params, boolean null2IsNull)
        boolean condition=false; // 条件
        queryWrapper.allEq(condition,params,true);
        // SELECT id,user_id,commodity_code,count,money,dept_id,tenant_id,is_deleted,version,oper_user,gmt_create,gmt_modified FROM order_tbl WHERE is_deleted=0
        List<OrderTbl> list = orderTblService.list(queryWrapper);
    }
```

使用BiPredicate函数式接口test()方法对params进行过滤，K为键，V为值，可以自定义过滤，返回false时，该KV将被移出params。

```java
    public <V> Children allEq(boolean condition, BiPredicate<R, V> filter, Map<R, V> params, boolean null2IsNull) {
        if (condition && CollectionUtils.isNotEmpty(params)) {
            params.forEach((k, v) -> {
                if (filter.test(k, v)) {
                    if (StringUtils.checkValNotNull(v)) {
                        this.eq(k, v);
                    } else if (null2IsNull) {
                        this.isNull(k);
                    }
                }
            });
        }
        return this.typedThis;
    }
```

```java
allEq(BiPredicate<R, V> filter, Map<R, V> params)
allEq(BiPredicate<R, V> filter, Map<R, V> params, boolean null2IsNull)
allEq(boolean condition, BiPredicate<R, V> filter, Map<R, V> params, boolean null2IsNull) 
```

**参数说明**：

```java
filter : 过滤函数,是否允许字段传入比对条件中
params、null2IsNull、condition : 同上
```

**案例演示**：

只演示第一个，其他两个和上面一样，注意不能使用lambdaQuery，否则会导致无法过滤K。

```java
    @Test
    public void allEqTest02() {
        System.out.println("----- allEq ------");
        QueryWrapper<OrderTbl> queryWrapper = Wrappers.query();
        Map<String, Object> params = new HashMap<>();
        params.put("user_id", "123");
        params.put("count", 0);
        queryWrapper.allEq((k, v) -> {
            // 此处表示params中键为user_id 并且值为"123"的参数才添加到条件中
            return "user_id".equals(k) && "123".equals(v);
        }, params);
        List<OrderTbl> list = orderTblService.list(queryWrapper);
    }
```

#### eq

等于=

```java
eq(R column, Object val)
eq(boolean condition, R column, Object val)
```

**参数说明**：

```java
column: 字段
val：字段值
condition : 该条件是否加入最后生成的sql中
```

**案例演示**：

```java
    @Test
    public void eqTest02() {
        System.out.println("----- eq ------");
        LambdaQueryWrapper<OrderTbl> queryWrapper = Wrappers.lambdaQuery();
        //queryWrapper.eq(OrderTbl::getUserId,123); // AND (user_id = 123)
        queryWrapper.eq(true,OrderTbl::getUserId,123);
        List<OrderTbl> list = orderTblService.list(queryWrapper);
    }
```

#### ne

不等于<>，参数同上。

```java
ne(R column, Object val)
ne(boolean condition, R column, Object val)
```

**案例演示**：

```java
    @Test
    public void neTest02() {
        System.out.println("----- ne ------");
        LambdaQueryWrapper<OrderTbl> queryWrapper = Wrappers.lambdaQuery();
        //queryWrapper.ne(OrderTbl::getUserId,123); // AND (user_id <> 123)
        queryWrapper.ne(true,OrderTbl::getUserId,123);
        List<OrderTbl> list = orderTblService.list(queryWrapper);
    }
```

#### gt

大于>，参数同上

**案例演示**：

```java
    @Test
    public void gtTest02() {
        System.out.println("----- gt ------");
        LambdaQueryWrapper<OrderTbl> queryWrapper = Wrappers.lambdaQuery();
        //queryWrapper.gt(OrderTbl::getId,999999); // AND (id > 999999)
        queryWrapper.gt(true,OrderTbl::getId,999999);
        List<OrderTbl> list = orderTblService.list(queryWrapper);
    }
```

#### ge

大于等于 >=，参数同上

```java
ge(R column, Object val)
ge(boolean condition, R column, Object val)
```

**案例演示**：

```java
    @Test
    public void geTest02() {
        System.out.println("----- ge ------");
        LambdaQueryWrapper<OrderTbl> queryWrapper = Wrappers.lambdaQuery();
        queryWrapper.ge(OrderTbl::getGmtCreate,new Date()); //   AND (gmt_create >= '2021-04-20T23:22:30.325+0800')
        //queryWrapper.ge(true,OrderTbl::getGmtCreate,new Date());
        List<OrderTbl> list = orderTblService.list(queryWrapper);
    }
```

#### lt

小于= 3.0.7 param 参数名要么叫ew,要么加上注解@Param(Constants.WRAPPER) 使用${ew.customSqlSegment} 不支持 Wrapper 内的entity生成where语句。

**案例演示**：

**1、** Mapper添加方法；

```java
    @Select("select * from order_tbl ${ew.customSqlSegment}")
    List<OrderTbl> getAll(@Param(Constants.WRAPPER) Wrapper wrapper);
```

**1、** 调用；

```java
    @Test
    public void wrapperTest02() {
        System.out.println("----- wrapper ------");
        LambdaQueryWrapper<OrderTbl> queryWrapper = Wrappers.lambdaQuery();
        queryWrapper.eq(OrderTbl::getCommodityCode,"phone");
        orderTblMapper.getAll(queryWrapper); // WHERE is_deleted=0 AND (commodity_code = 'phone')
        List<OrderTbl> list = orderTblService.list(queryWrapper);
    }
```

## 链式调用 lambda 式

wrapper支持链式调用

```java
// 区分:
// 链式调用 普通
UpdateChainWrapper<T> update();
// 链式调用 lambda 式。注意：不支持 Kotlin 
LambdaUpdateChainWrapper<T> lambdaUpdate();
// 等价示例：
query().eq("id", value).one();
lambdaQuery().eq(Entity::getId, value).one();
// 等价示例：
update().eq("id", value).remove();
lambdaUpdate().eq(Entity::getId, value).remove();
```

参考：https://baomidou.com/
