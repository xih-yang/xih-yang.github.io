# 06、TypeScript 实战 - 数组类型的定义
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/6.html
- 分类：前端框架
- 分组：教程目录
## 常见且单一的数组:

```java
const numberArr:string[]=["123","456","789"]
```

## 数组有多种类型格式的:

```java
const AtWill(string||number)[]=["小爱好",18]
```

## 数组中对象的定义

```java
const obj:{
     name:string,age:number}[]=[{
     name:"小哈",age:18}]
```

## type alias:TypeScript 为我们准备了一个概念，叫做类型别名(type alias)

```java
简单来说就是先定义好类型，可以重复调用
type information= {
     name:string,age:number}
const obj:information[]=[{
     name:"小哈"，age:18}]
```

## 根据 type alias 我们可以推导出用class类来定义数组中的类型

```java
calss signs {
	name:string,
	age:number
}
const obj:signs[]=[{
     name:"小哈"，age:21},{
     name:"小呀",age:18}]
```

## 以上就是我们数组类型的定义了
