# 09、jQuery 教程 - jQuery设置获取属性attr()
- 来源：https://ddkk.com/zhuanlan/qianduan/jquery/1/9.html
- 分类：前端框架
- 分组：教程目录
### attr()方法

- attr() 方法获取属性值。

```java
<a href="www.csdn.net" class="my">CSDN</a>
```

```java
$('.my').attr('href');//www.csdn.net
```

- attr() 方法设置属性值。

```java
<a href="www.csdn.net" class="my">CSDN</a>
```

```java
$('.my').attr('href', 'www.baidu.com');
```

```java
<a href="www.baidu.com" class="my">CSDN</a>
```

### 延伸

- removeAttr() 方法从被选元素中移除属性。

```java
<a href="www.baidu.com" class="my">CSDN</a>
```

```java
$('.my').removeAttr('href');
```

```java
<a class="my">CSDN</a>
```
